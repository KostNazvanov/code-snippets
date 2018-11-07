import React from "react";
import classnames from "classnames";
import { bool, shape, string, oneOf, object } from "prop-types";

import { Button } from "components/controls";

import classes from "./ReadyToJoin.less";
import defaultProps from "./ReadyToJoin.settings";


export default class ReadyToJoin extends React.PureComponent {
    static propTypes = {
        id: string,
        title: shape({
            tag: oneOf(["h1", "h2", "h3", "h4", "h5", "h6"]),
            text: string,
            visible: bool,
        }),
        backgroundColor: object,
        titleColor: object,
        descriptionColor: object,
        buttonColor: object,
        description: shape({
            text: string
        }),
        firstButton: shape({
            link: string,
            label: string
        }),
        secondButton: shape({
          link: string,
          label: string
        }),
        theme: string,
        className: string
    }

    static defaultProps = defaultProps

    getTextColorStyle(typeBlock, name) {
        let { r, g, b, a } = typeBlock;

        return {
            color: `rgba(${r}, ${g}, ${b}, ${a})`,
            [name]: `rgba(${r}, ${g}, ${b}, ${a})`
        };
    }

    getContentHtml(text) {
        return {
            __html: text.replace(/(?:\r\n|\r|\n)/g, "<br />")
        };
    }

    get classes() {
        return classnames(classes.readyToJoin, this.props.className);
    }

    get attributes() {
        let attributes = {};

        if (this.props.id) {
            attributes.id = this.props.id;
        }

        return attributes;
    }

    renderContent() {
        let { title, description, theme, titleColor, descriptionColor } = this.props;
        let TitleTagName = title.tag;

        let titleClasses = classnames({
            [classes.readyToJoinTitle] : true,
            [classes.readyToJoinTitleCenter]: theme === "Centered"
        });

        let descriptionClasses = classnames({
            [classes.readyToJoinDescription] : true,
            [classes.readyToJoinDescriptionCenter]: theme === "Centered"
        });

        let titleStyle = this.getTextColorStyle(titleColor);
        let descriptionStyle = this.getTextColorStyle(descriptionColor);

        return (
            <div className={classes.readyToJoinContent}>
                {
                    title.visible &&
                    <TitleTagName
                        style={titleStyle}
                        className={titleClasses}
                        dangerouslySetInnerHTML={this.getContentHtml(title.text)}>
                    </TitleTagName>
                }

                <p
                    style={descriptionStyle}
                    className={descriptionClasses}
                    dangerouslySetInnerHTML={this.getContentHtml(description.text)}>
                </p>
            </div>
        );
    }

    get style() {
        let { backgroundColor: { r, g, b, a } } = this.props;

        return {
            backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})`
        };
    }

    render() {
        let { firstButton, secondButton, theme, buttonColor } = this.props;

        let containerClasses = classnames({
            [classes.readyToJoinContainer]: true,
            [classes.readyToJoinContainerCenter]: theme === "Centered"
        });

        let secondButtonClasses = classnames(classes.readyToJoinButton, classes.readyToJoinSecondButton);

        let buttonStyle = this.getTextColorStyle(buttonColor);

        return (
            <div className={this.classes} {...this.attributes} style={this.style}>
                <div className={containerClasses}>
                    { this.renderContent() }

                    <div className={classes.readyToJoinButtonWrapper}>
                        {
                            secondButton.label &&
                            <Button
                                type="alternate"
                                link={secondButton.link}
                                label={secondButton.label}
                                className={secondButtonClasses}
                                buttonStyles={buttonStyle}
                            />
                        }

                        {
                            firstButton.label &&
                            <Button
                                link={firstButton.link}
                                label={firstButton.label}
                                className={classes.readyToJoinButton}
                                buttonStyles={buttonStyle}
                            />
                        }
                    </div>
                </div>
            </div>
        );
    }
}