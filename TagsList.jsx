import React from 'react'
import { Tag as ATag } from 'antd';

export const colorFromString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }

  return color;
};

export const Tag = props => <ATag color={colorFromString(props.id)} {...props}>{props.title}</ATag>;

const TagsList = props => {
  const { tags = [] } = props;

  return (
    <div className="tag-list">
      {tags.map(tag => <Tag key={tag.id} id={tag.id} title={tag.title} />)}
    </div>
  )
};

export default TagsList
