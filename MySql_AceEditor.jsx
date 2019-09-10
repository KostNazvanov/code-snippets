import React, { Component } from 'react';
import AceEditor from 'react-ace';
import lexer from 'sql-parser/lib/lexer';
import uuid from 'uuid';

import 'brace/mode/mysql';
import 'brace/theme/tomorrow';
import 'brace/snippets/mysql';
import 'brace/ext/language_tools';
/* eslint-disable-next-line */
const langTools = ace.acequire('ace/ext/language_tools');

class QueryEditor extends Component {
  tokens = [
    {
      meta: 'field',
      tokens: ['SELECT', 'WHERE', 'GROUP BY'],
    },
    {
      meta: 'table',
      tokens: ['FROM'],
    }
  ];

  keywords = [
    'select',
    'from',
    'where',
    'or',
    'and',
    'not',
    'nor',
    'null',
    'is',
    'in',
    'between',
    'like',
    'by',
    'true',
    'false',
  ];

  // Get all tokens
  get allTokens() {
    return this.tokens.map(({ tokens }) => tokens).flat();
  }

  // Is specified token is closest to carriage
  isClosestToken = (token, lines, { column, row}) => {
    if (!token || !this.allTokens.includes(token)) return false;

    const cursorPos = lines
      .reduce(
        (acc, value, index) =>
          index < row
            ? acc + value.length
            : acc,
        column
      );

    const query = lines.join(' ').toUpperCase();
    const tokensPos = this.allTokens.map(t => ({
      token: t,
      pos: query.indexOf(t),
    }));

    const closestToken = tokensPos
      .sort((a, b) => a.pos - b.pos)
      .filter(({ pos }) => pos <= cursorPos)
      .pop();

    return closestToken.token === token;
  };

  // Add autocomplete keywords on mount
  componentDidMount = () => {
    langTools.setCompleters([]); // Clear global completers
    langTools.addCompleter({ // Add keywords
      getCompletions:
        (_e, _s, _, _p, callback) => callback(null, this.keywords.map(word => ({
          caption: word,
          meta: 'keyword',
          value: word,
        })))
    });
    langTools.addCompleter({ // Add fields from datasource
      getCompletions: (
        _e,
        session,
        { column, row },
        _p,
        callback
      ) => {
        const lines = session.doc.$lines;

        // Get fields and name of table from datasource
        const parseDatasource = ({ name, fields }) => ([
          {
            name: name,
            meta: 'table',
          },
          ...fields.map(field => ({
            name: field.name,
            meta: 'field',
          }))
        ]);

        // Generate keywords from data
        const generateWords = ({ name, meta }) => {
          const token = this.tokens.find(t => t.meta === meta);
          if (!token) return false;

          if (!token.tokens.some(t => this.allTokens.includes(t))) return false; // If token not valid

          if (!token.tokens.some(t => this.isClosestToken(t, lines, { column, row }))) return false; // If token not in correct position

          return ({
            caption: name,
            value: name,
            meta: meta
          });
        };

        const words = this
          .props
          .datasources
          .map(parseDatasource)
          .flat()
          .map(generateWords)
          .filter(Boolean);

        callback(null, words);
      }
    });
  };

  // Get operator from key and visa verse
  getOperator = (operator, isReverseTranslate) => {
    const operatorList = {
      equal: '=',
      not_equal: '!=',
      in: 'IN',
      not_in: 'NOT IN',
      less: '<',
      less_or_equal: '<=',
      greater: '>',
      greater_or_equal: '>=',
      between: 'BETWEEN',
      not_between: 'NOT BETWEEN',
      begins_with: 'LIKE',
      not_begins_with: 'NOT LIKE',
      contains: 'LIKE',
      not_contains: 'NOT LIKE',
      ends_with: 'LIKE',
      not_ends_with: 'NOT LIKE',
      is_null: 'IS NULL',
      is_not_null: 'IS NOT NULL',
    };

    if (isReverseTranslate) {
      return Object.keys(operatorList).find(key => operatorList[key] === operator) || '';
    } else {
      return operatorList[operator] || '';
    }
  };

  getDatasourceName = (_id) => {
    const datasources = this.props.datasources || [];
    return (datasources.find(({ id }) => id === _id) || {}).name;
  };

  getFields = (fields) => {
    return Object.values(fields)
      .map(field => field ? field.field : false)
      .filter(Boolean)
      .join(', ');
  };

  // Get MySql valud string of conditions
  getConditions = (conditions) => {
    const values = conditions.rules.map(({ field, operator, value }) => {
      return [
        field,
        this.getOperator(operator),
        value,
      ].join(' ');
    });

    if (values.length > 1) {
      return values.join(`${conditions.combinator} `);
    } else {
      return values.pop();
    }
  };

  // Transform squel object to valid MySql string query
  queryToSql = (query) => {
    const {
      table,
      fields,
      conditions,
    } = query;

    return [
      fields ? `SELECT ${this.getFields(fields)}` : '',
      table ? `FROM ${this.getDatasourceName(table)}` : '',
      conditions ? `WHERE ${this.getConditions(conditions)}` : '',
    ].join(' ');
  };

  // Transform valid MySql string query to squel object
  sqlToQuery = (string) => {
    const fields = [];
    const aliases = {};
    const table = [];
    const conditions = [];

    let state = -1; // 0 - select, 1 - from, 2 - where, 3 - end
    /* eslint-disable */
    const handleValue = (value) => {
      switch (state) {
        case 0: { // Add SELECT field
          fields.push(value);
          return;
        }
        case 0.1: { // Add AS literal
          aliases[fields[fields.length - 1]] = value;
          state = 0;
          return;
        }
        case 1: { // New part of FROM table name
          table.push(value);
          return;
        }
        case 2: { // Create new WHERE condition and set it's field
          conditions.push({ operator: [] });
          conditions[conditions.length - 1].field = value;
          state = 2.1;
          return;
        }
        case 2.2: { // Add value to WHERE condition
          if (conditions[conditions.length - 1].value !== undefined) {
            conditions[conditions.length - 1].value = [...conditions[conditions.length - 1].value, value];
          } else {
            conditions[conditions.length - 1].value = value;
          }
          return;
        }
        default:
          return;
      }
    };

    const handleTokens = (token) => {
      const [key, value] = token;
      switch (key.toUpperCase()) {
        case 'SELECT': { // Start adding SELECT fields
          state = 0;
          return;
        }
        case 'FROM': { // Start adding FROM parts of table name
          state = 1;
          return;
        }
        case 'WHERE': { // Start adding WHERE conditions
          state = 2;
          return;
        }
        case 'AS': {
          state = 0.1;
          return;
        }
        case 'NUMBER': // Handle value
        case 'LITERAL': {
          handleValue(value);
          return;
        }
        case 'CONDITIONAL': { // Start adding another WHERE condition
          conditions.push(value);
          state = 2;
          return;
        }
        case 'BOOLEAN': { // Instead of WHERE condition 'value', push it to 'operator'
          if (state === 2.2) {
            conditions[conditions.length - 1].operator.push(...value.split(' '));
            state = 2.3;
          }
          return;
        }
        case 'OPERATOR': { // Add WHERE condition operator
          if (state === 2.1) {
            conditions[conditions.length - 1].operator.push(...value.split(' '));
            state = 2.2;
          }
          return;
        }
        default:
          return;
      }
    };
    /* eslint-enable */

    // Finally transform all collected data into squel object
    try {
      if (this.props.onChange) {
        lexer.tokenize(string).forEach(handleTokens);

        const _table = this.props.datasources.find(({ name }) => name === table.join(' '));
        if (!_table) return;

        const newQuery = {
          queryString: string,
          tableName: _table.name,
          table: _table.id,
          fields: fields.map(field => ({
            alias: aliases[field] || null,
            field: field,
            fn: 'all',
            raw: field,
          })),
          conditions: conditions.length === 0 ? undefined : {
            id: uuid(),
            combinator: conditions.length > 1 ? conditions[1] : 'OR',
            rules: conditions
              .splice(0, 3)
              .map(con =>
                typeof con === 'string' ? false : ({
                  id: uuid(),
                  field: con.field,
                  operator: this.getOperator(con.operator.join(' ').toUpperCase(), true),
                  value: con.value || '',
                }))
              .filter(Boolean),
          },
        };

        this.props.onChange(newQuery);
      }
    } catch (e) {
      global.console.error('Failed to parse mysql to object ', e);
    }
  };

  render = () => {
    const {
      query,
      datasources,
      ...rest
    } = this.props;

    return (
      <AceEditor
        {...rest}
        width="auto"
        mode="mysql"
        theme="tomorrow"
        onChange={this.sqlToQuery}
        wrapEnabled={true}
        fontSize={14}
        showPrintMargin={true}
        showGutter={true}
        maxLines={8}
        highlightActiveLine={true}
        value={query.queryString || this.queryToSql(query)}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: false,
          showLineNumbers: true,
          tabSize: 2,
        }}
      />
    )
  }
}

export default QueryEditor;
