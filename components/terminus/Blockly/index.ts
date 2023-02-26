import React from 'react';
import BlocklyComponent from './BlocklyComponent';

export default BlocklyComponent;

const Block = (p) => {
  const { children, ...props } = p;
  props.is = 'blockly';
  return React.createElement('block', props, children);
};

export { Block };
