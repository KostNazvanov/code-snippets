import { Card, Checkbox, Col, Row, Spin } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import * as React from 'react';

export interface IToothMatrixProps {
  value: string;
  initializing?: boolean;
  loading?: boolean;
  readonly?: boolean;
  onChange?: (
    value: string
  ) => void;
}

class ToothMatrix extends React.Component<IToothMatrixProps> {
  public render() {
    if (this.props.initializing) {
      return <Card loading={true} />
    }

    const checkedIndexes = this.props.value
      .split(',')
      .map((index: string) => parseInt(index, 10));

    return (
      <Spin spinning={this.props.loading}>
        <Row gutter={8}>
          {
            [
              this.generateColumn(11, 18, true, checkedIndexes),
              this.generateColumn(21, 28, false, checkedIndexes),
            ]
          }
        </Row>
        <Row gutter={8}>
          {
            [
              this.generateColumn(41, 48, true, checkedIndexes),
              this.generateColumn(31, 38, false, checkedIndexes),
            ]
          }
        </Row>
      </Spin>
    )
  }

  private generateColumn = (
    minIndex: number,
    maxIndex: number,
    reverse: boolean,
    checkedIndexes: number[],
  ) => (
    <Col
      span={12}
      key={minIndex}
    >
      {
        Array(maxIndex - minIndex + 1)
          .fill(0)
          .map((v: number, i: number) => i)
          .map((column: number) => {
            const index =
              reverse
                ? maxIndex - column
                : column + minIndex;

            return this.generateTooth(
              index,
              checkedIndexes.indexOf(index) > -1
            )
          })
      }
    </Col>
  );

  private generateTooth = (
    index: number,
    checked: boolean,
  ) => (
    <Col
      key={index}
      span={3}
      style={{
        border: '1px solid lightgrey',
        display: 'grid',
        justifyContent: 'center',
      }}
    >
      {index}
      <Checkbox
        disabled={this.props.readonly}
        defaultChecked={checked}
        onChange={
          (event: CheckboxChangeEvent) =>
            this.props.onChange &&
            this.onToothChange(index, event.target.checked)
        }
      />
    </Col>
  );

  private onToothChange = (
    index: number,
    checked: boolean
  ) => {
    const { onChange, value } = this.props;

    if (typeof onChange !== 'function') {
      return;
    }

    const toothLocations = value
      .split(',')
      .map((x: string) => parseInt(x, 10))
      .filter((x: number) => !!x);

    const toothIndex = toothLocations.indexOf(index);
    if (checked && toothIndex === -1) {
      toothLocations.push(index);
    } else if (!checked && toothIndex > -1) {
      toothLocations.splice(toothLocations.indexOf(index), 1);
    }

    onChange(toothLocations.join(','))
  }
}

export default ToothMatrix;
