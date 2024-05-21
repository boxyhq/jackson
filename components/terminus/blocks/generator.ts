import { javascriptGenerator } from 'blockly/javascript';

/// TERMINUS STRUCTURE
const CONST_OBJ_GLB_ENCR = '_trm_globalEncrpt_';
const ObjectMap = new Map();
let currentObject, currentField;

const IGNORE_FIELDS = [CONST_OBJ_GLB_ENCR];

export const generateModel = (workspace, roles: string[]) => {
  ObjectMap.clear();

  javascriptGenerator['data_object_field_mask'] = function (block) {
    for (let i = 0; i < roles.length; i++) {
      const objName = block.getFieldValue(`object_type_${roles[i]}`);
      currentField[2 + i] = objName; // mask
    }

    javascriptGenerator.statementToCode(block, 'input');

    return '';
  };

  // trigger the BLOCKLY processing which will run our custom code generation
  javascriptGenerator.workspaceToCode(workspace);
  const ret = generateStructure(roles);

  return JSON.stringify(ret);
};

const generateStructure = (roles: string[]) => {
  const model: any = {};
  for (const [key, value] of Object.entries(Object.fromEntries(ObjectMap))) {
    model.name = key;
    model.attributes = {};
    const valuesMap = Object.fromEntries(value as any);

    for (const [field, values] of Object.entries(valuesMap)) {
      const rolesMap = {};
      for (let i = 0; i < roles.length; i++) {
        rolesMap[roles[i]] = values[i + 2];
      }

      model.attributes[field] = {
        type: values[0],
        encryption: values[1],
        masking: {
          roles: rolesMap,
        },
      };
      if (IGNORE_FIELDS.includes(field)) {
        continue;
      }
    }
  }

  return model;
};

javascriptGenerator['data_object_wrapper'] = function (block) {
  const objectName = block.getField('object_name').getText();
  currentObject = new Map();
  ObjectMap.set(objectName, currentObject);

  javascriptGenerator.statementToCode(block, 'data_object_wrapper');

  return '';
};

javascriptGenerator['data_object_wrapper_with_encryption'] = function (block) {
  const objectName = block.getField('object_name').getText();
  // global encryption
  currentObject = new Map();
  currentObject.set(CONST_OBJ_GLB_ENCR, block.getFieldValue('encryption'));
  ObjectMap.set(objectName, currentObject);

  javascriptGenerator.statementToCode(block, 'data_object_wrapper_with_encryption');

  return '';
};

javascriptGenerator['data_object_field_wrapper'] = function (block) {
  const objectName = block.getField('field_name').getText();
  currentField = new Array(3);
  currentObject.set(objectName, currentField);

  javascriptGenerator.statementToCode(block, 'input');

  return '';
};

javascriptGenerator['data_object_field_type'] = function (block) {
  const objectName = block.getFieldValue('object_type');
  currentField[0] = objectName; // type
  currentField[2] = 'Redact'; // mask
  currentField[3] = 'Redact'; // mask

  javascriptGenerator.statementToCode(block, 'input');

  return '';
};

javascriptGenerator['data_object_field_encryption'] = function (block) {
  const objectName = block.getFieldValue('object_type');
  currentField[1] = objectName; // encryption

  javascriptGenerator.statementToCode(block, 'input');

  return '';
};
