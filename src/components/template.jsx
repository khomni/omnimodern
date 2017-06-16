import React from 'react';
import ReactDOM from 'react-dom';

export default class Template extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.interval = setInterval(()=> this.internalMethod(), 500);

  }

  internalMethod() {
    this.setState({stateVariable: new Date()})
  }

  componentWillUnmount() {
    clearInterval(this.interval);

  }

  render() {
    return <div>{this.state.stateVariable}</div>
  }
}
