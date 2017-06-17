import React from 'react';
import ReactDOM from 'react-dom';

import Navbar, {Navlink} from './components/navigation.jsx'

class Main extends React.Component {
  render() {
    return <div id="content-main"></div>
  }
}

ReactDOM.render(
  <Main/>,
  document.getElementById('root')
);
