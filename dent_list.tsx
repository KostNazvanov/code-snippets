import { List } from 'antd';
import * as moment from 'moment';
import * as React from 'react';
import 'react-chat-widget/lib/styles.css';
import * as InfiniteScroll from 'react-infinite-scroller';
import {
  ResourceCollection,
  ResourceCollectionLayer,
  SortInfoOrder
} from 'webpanel-data';

import { api } from '../../model/api';
import { DeleteButton } from '../delete-button';
import { SpinningCard } from '../spinning-card/spinning-card';
import { CommentsForm } from './form';

export interface ICommentsListProps {
  referenceID: string;
  inputPosition?: 'top' | 'bottom';
}

export class CommentsList extends React.Component<ICommentsListProps> {
  public render() {
    return (
      <ResourceCollectionLayer
        name="comments"
        fields={[
          'id',
          'text',
          'createdByUser { firstname lastname }',
          'createdAt'
        ]}
        initialFilters={{ job: this.props.referenceID }}
        initialSorting={[
          { columnKey: 'createdAt', order: SortInfoOrder.descend }
        ]}
        initialLimit={10}
        initialOffset={0}
        dataSource={api}
        render={(comments: ResourceCollection) => (
          <SpinningCard observedResource={comments} title="Komentáře">
            {this.props.inputPosition === 'top' && (
              <div style={{ marginBottom: '10px' }}>
                <CommentsForm
                  referenceID={this.props.referenceID}
                  onMessageSent={comments.get}
                />
              </div>
            )}
            <div
              style={{
                overflow: 'scroll',
                maxHeight: '512px'
              }}
            >
              <InfiniteScroll
                threshold={64}
                loadMore={() =>
                  comments.updateLimit((comments.limit || 0) + 10)
                }
                useWindow={false}
                hasMore={
                  !comments.loading &&
                  comments.limit !== undefined &&
                  comments.count !== undefined &&
                  comments.count > comments.limit
                }
              >
                <List
                  size="small"
                  itemLayout="horizontal"
                  dataSource={comments.data}
                  renderItem={(item: any) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <div>
                            {item.createdByUser
                              ? `${item.createdByUser.firstname} ${
                                  item.createdByUser.lastname
                                }`
                              : 'Unknown'}{' '}
                            {item.createdAt
                              ? `(${moment(item.createdAt).calendar()})`
                              : ''}
                          </div>
                        }
                        description={
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ margin: 'auto 0' }}>{item.text}</div>
                            <DeleteButton
                              onDelete={async () => {
                                await comments.delete(item.id);
                                await comments.get();
                              }}
                            />
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </InfiniteScroll>
            </div>
            {(this.props.inputPosition === undefined ||
              this.props.inputPosition === 'bottom') && (
              <CommentsForm
                referenceID={this.props.referenceID}
                onMessageSent={comments.get}
              />
            )}
          </SpinningCard>
        )}
      />
    );
  }
}
