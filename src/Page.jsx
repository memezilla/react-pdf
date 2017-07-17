import React, { Component } from 'react';
import PropTypes from 'prop-types';

import PageCanvas from './PageCanvas';
import PageTextContent from './PageTextContent';

import {
  callIfDefined,
  isProvided,
} from './shared/util';

export default class Page extends Component {
  state = {
    page: null,
  }

  componentDidMount() {
    this.loadPage();
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.pdf !== this.props.pdf ||
      this.getPageNumber(nextProps) !== this.getPageNumber()
    ) {
      this.loadPage(nextProps);
    }
  }

  /**
   * Called when a page is loaded successfully
   */
  onLoadSuccess = (page) => {
    this.setState({ page });

    const { scale } = this;

    callIfDefined(
      this.props.onLoadSuccess,
      {
        ...page,
        // Legacy callback params
        get width() { return page.view[2] * scale; },
        get height() { return page.view[3] * scale; },
        scale,
        get originalWidth() { return page.view[2]; },
        get originalHeight() { return page.view[3]; },
      },
    );
  }

  /**
   * Called when a page failed to load
   */
  onLoadError = (error) => {
    callIfDefined(
      this.props.onLoadError,
      error,
    );

    this.setState({ page: false });
  }

  getPageIndex(props = this.props) {
    if (isProvided(props.pageIndex)) {
      return props.pageIndex;
    }

    if (isProvided(props.pageNumber)) {
      // @TODO: Page number isn't always the same
      return props.pageNumber - 1;
    }

    return null;
  }

  getPageNumber(props = this.props) {
    if (isProvided(props.pageNumber)) {
      return props.pageNumber;
    }

    if (isProvided(props.pageIndex)) {
      // @TODO: Page index isn't always the same
      return props.pageIndex + 1;
    }

    return null;
  }

  get pageIndex() {
    return this.getPageIndex();
  }

  get pageNumber() {
    // @TODO: Page numer isn't always the same
    return this.getPageNumber();
  }

  get rotate() {
    const { rotate } = this.props;

    if (isProvided(rotate)) {
      return rotate;
    }

    const { page } = this.state;

    return page.rotate;
  }

  get scale() {
    const { scale, width } = this.props;
    const { page } = this.state;
    const { rotate } = this;

    // Be default, we'll render page at 100% * scale width.
    let pageScale = 1;

    // If width is defined, calculate the scale of the page so it could be of desired width.
    if (width) {
      const viewport = page.getViewport(scale, rotate);
      pageScale = width / viewport.width;
    }

    return scale * pageScale;
  }

  loadPage(props = this.props) {
    const { pdf } = props;
    const pageNumber = this.getPageNumber(props);

    if (!pdf) {
      throw new Error('Attempted to load a page, but no document was specified.');
    }

    if (this.state.page !== null) {
      this.setState({ page: null });
    }

    pdf.getPage(pageNumber)
      .then(this.onLoadSuccess)
      .catch(this.onLoadError);
  }

  render() {
    const { pdf } = this.props;
    const { page } = this.state;
    const { pageIndex } = this;

    if (!pdf || !page) {
      return null;
    }

    if (pageIndex < 0 || pageIndex > pdf.numPages) {
      return null;
    }

    const {
      onGetTextError,
      onGetTextSuccess,
      onRenderError,
      onRenderSuccess,
     } = this.props;

    return (
      <div
        className="ReactPDF__Page"
        style={{ position: 'relative' }}
      >
        <PageCanvas
          onRenderError={onRenderError}
          onRenderSuccess={onRenderSuccess}
          page={page}
          rotate={this.rotate}
          scale={this.scale}
        />
        <PageTextContent
          onGetTextError={onGetTextError}
          onGetTextSuccess={onGetTextSuccess}
          page={page}
          rotate={this.rotate}
          scale={this.scale}
        />
      </div>
    );
  }
}

Page.defaultProps = {
  scale: 1.0,
};

Page.propTypes = {
  onGetTextError: PropTypes.func,
  onGetTextSuccess: PropTypes.func,
  onLoadError: PropTypes.func,
  onLoadSuccess: PropTypes.func,
  onRenderError: PropTypes.func,
  onRenderSuccess: PropTypes.func,
  // @TODO: Check if > 0, < pdf.numPages
  pageIndex: PropTypes.number,
  pageNumber: PropTypes.number,
  pdf: PropTypes.shape({
    getPage: PropTypes.func.isRequired,
    numPages: PropTypes.number.isRequired,
  }),
  rotate: PropTypes.number,
  scale: PropTypes.number,
  width: PropTypes.number,
};