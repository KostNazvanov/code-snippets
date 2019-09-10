import React, { Component } from 'react';
import { Tag, Select, Icon, Popconfirm } from 'antd';

import styles from './multiselect.less';
import { colorFromString } from '/TagsList';

class MultiSelect extends Component {
  // Render tags itself
  getValues = () => {
    const {
      value,
      isColorful,
      getTagTitle,
      confirmDelete,
    } = this.props;

    const getColor = (v) => isColorful
      ? colorFromString(v)
      : undefined;

    return value.map((v, index) => (
      <div
        key={v}
        className={styles.tag}
      >
        <Tag
          color={getColor(v)}
        >
          {
            getTagTitle
              ? getTagTitle(v)
              : v
          }
        </Tag>
        {
          confirmDelete
            ? (
              <Popconfirm
                title={`Are you sure you want to delete?`}
                okText="Yes"
                cancelText="No"
                className={styles.delete}
                type="danger"
                onConfirm={() => this.onDelete(index)}
                icon={<Icon
                  type="exclamation-circle"
                  theme="filled"
                  style={{ color: 'red' }}
                />}
              >
                <Icon
                  className={styles["delete-tag"]}
                  type="close"
                />
              </Popconfirm>
            ) : (
              <Icon
                className={styles["delete-tag"]}
                type="close"
                onClick={() => this.onDelete(index)}
              />
            )
        }
      </div>
    ))
  };

  onDelete = (index) => {
    const values = this.props.value;
    delete values[index];
    this.props.onChange(values.filter(x => !!x))
  };


  onChange = ([newVal]) => {
    if (this.props.onChange) {
      const index = this.props.value.indexOf(newVal);
      if (index > -1 && this.props.showDropdown) {
        this.onDelete(index);
      } else if (newVal) {
        this.props.onChange([...this.props.value, newVal])
      }
    }
  };

  // Render select
  getSelect = () => {
    const {
      className,
      showDropdown,
      children,
      ...rest
    } = this.props;

    return (
      <Select
        className={className}
        mode="tags"
        // style={{ width: '512px' }}
        autoClearSearchValue={true}
        showArrow={false}
        dropdownStyle={
          showDropdown
            ? undefined
            : { display: 'none' }
        }
        {...rest}
        dropdownMatchSelectWidth={false}
        filterOption={false}
        notFoundContent={false}
        onChange={this.onChange}
        value={[]}
        ref={ref => this.input = ref}
      >
        {children}
      </Select>
    )
  };

  render = () => {
    return (
      <div
        className={styles["multi-select"]}
        onClick={() => this.input.focus()}
      >
        <div className={styles.tags}>
          {this.getValues()}
        </div>
        {this.getSelect()}
      </div>
    )
  }
}

export default MultiSelect;
