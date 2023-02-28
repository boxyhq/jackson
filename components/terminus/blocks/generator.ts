import { javascriptGenerator } from 'blockly/javascript';

/// TERMINUS STRUCTURE
export const CONST_OBJ_GLB_ENCR = '_trm_globalEncrpt_';
export const ObjectMap = new Map();
let currentObject, currentField;

javascriptGenerator['data_object_wrapper'] = function (block) {
  const objectName = block.getField('object_name').getText();
  currentObject = new Map();
  ObjectMap.set(objectName, currentObject);

  javascriptGenerator.statementToCode(block, 'data_object_wrapper') || '0';

  return '';
};

javascriptGenerator['data_object_wrapper_with_encryption'] = function (block) {
  const objectName = block.getField('object_name').getText();
  // global encryption
  currentObject = new Map();
  currentObject.set(CONST_OBJ_GLB_ENCR, block.getFieldValue('encryption'));
  ObjectMap.set(objectName, currentObject);

  javascriptGenerator.statementToCode(block, 'data_object_wrapper_with_encryption') || '0';

  return '';
};

javascriptGenerator['data_object_field_wrapper'] = function (block) {
  const objectName = block.getField('field_name').getText();
  currentField = new Array(3);
  currentObject.set(objectName, currentField);

  javascriptGenerator.statementToCode(block, 'input', javascriptGenerator.ORDER_NONE) || '0';

  return '';
};

javascriptGenerator['data_object_field_type'] = function (block) {
  const objectName = block.getFieldValue('object_type');
  currentField[0] = objectName; // type

  javascriptGenerator.statementToCode(block, 'input', javascriptGenerator.ORDER_NONE) || '0';

  return '';
};

javascriptGenerator['data_object_field_default_types'] = javascriptGenerator['data_object_field_type'];

javascriptGenerator['data_object_field_encryption'] = function (block) {
  const objectName = block.getFieldValue('object_type');
  currentField[1] = objectName; // encryption

  javascriptGenerator.statementToCode(block, 'input', javascriptGenerator.ORDER_NONE) || '0';

  return '';
};

javascriptGenerator['data_object_field_mask'] = function (block) {
  const objectName = block.getFieldValue('object_type');
  currentField[2] = objectName; // mask
  return '';
};
