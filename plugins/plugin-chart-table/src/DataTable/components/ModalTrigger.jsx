/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import cx from 'classnames';

const propTypes = {
  dialogClassName: PropTypes.string,
  animation: PropTypes.bool,
  triggerNode: PropTypes.node.isRequired,
  modalTitle: PropTypes.node,
  modalFooter: PropTypes.node,
  onExit: PropTypes.func,
  bsSize: PropTypes.string,
  className: PropTypes.string,
  tooltip: PropTypes.string,
  backdrop: PropTypes.oneOf(['static', true, false]),
};

const defaultProps = {
  animation: true,
  onExit: () => {},
  bsSize: null,
  className: '',
  modalTitle: '',
};

export default class ModalTrigger extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
    };
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
  }

  close() {
    this.setState(() => ({ showModal: false }));
  }

  open(e) {
    e.preventDefault();
    this.setState(() => ({ showModal: true }));
  }
  renderModal() {
    return (
      <Modal
        dialogClassName={this.props.dialogClassName}
        animation={this.props.animation}
        show={this.state.showModal}
        onHide={this.close}
        onExit={this.props.onExit}
        bsSize={this.props.bsSize}
        className={this.props.className}
        backdrop={this.props.backdrop}
        style={{
          display: 'flex',
          alignItems: 'center',
          marginLeft: '19vw',
        }}
      >
        {this.props.modalTitle && (
          <Modal.Header
            closeButton
            style={{
              padding: '25px 23px 26px',
              borderBottom: 'none',
            }}
          >
            <Modal.Title
              style={{
                color: '#202C56',
                fontFamily: "'Roboto', sans-serif",
                fontWeight: '700',
                fontSize: '22px',
                margin: '0px 0px 0px 27px',
              }}
            >
              {this.props.modalTitle}
            </Modal.Title>
          </Modal.Header>
        )}
        <Modal.Body
          style={{
            padding: '0px 50px',
          }}
        >
          {this.props.modalBody}
        </Modal.Body>
        {this.props.modalFooter && (
          <Modal.Footer style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
            {this.props.modalFooter}
          </Modal.Footer>
        )}
      </Modal>
    );
  }

  render() {
    const classNames = cx({
      'btn btn-default btn-sm': this.props.isButton,
    });
    /* eslint-disable jsx-a11y/interactive-supports-focus */
    return (
      <>
        <span className={classNames} onClick={this.open} role="button">
          {this.props.triggerNode}
        </span>
        {this.renderModal()}
      </>
    );
  }
}
ModalTrigger.propTypes = propTypes;
ModalTrigger.defaultProps = defaultProps;
