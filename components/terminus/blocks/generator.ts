import { javascriptGenerator } from 'blockly/javascript';

/// TERMINUS STRUCTURE
const CONST_OBJ_GLB_ENCR = '_trm_globalEncrpt_';
const ObjectMap = new Map();
let currentObject, currentField;

const IGNORE_FIELDS = [CONST_OBJ_GLB_ENCR];

export const generateModel = (workspace, roles: string[]) => {
  ObjectMap.clear();

  javascriptGenerator.forBlock['data_object_field_mask'] = function (block) {
    currentField['mask'] = new Map();
    for (let i = 0; i < roles.length; i++) {
      const objName = block.getFieldValue(`object_type_${roles[i]}`);
      currentField['mask'][roles[i]] = objName ? objName : 'Redact'; // mask
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
        type: values['type'],
        encryption: values['encryption'],
        masking: {
          roles: values['mask'],
        },
      };
      if (IGNORE_FIELDS.includes(field)) {
        continue;
      }
    }
  }

  return model;
};

javascriptGenerator.forBlock['data_object_wrapper'] = function (block) {
  const objectName = block.getField('object_name')!.getText();
  currentObject = new Map();
  ObjectMap.set(objectName, currentObject);

  javascriptGenerator.statementToCode(block, 'data_object_wrapper');

  return '';
};

javascriptGenerator.forBlock['data_object_wrapper_with_encryption'] = function (block) {
  const objectName = block.getField('object_name')!.getText();
  // global encryption
  currentObject = new Map();
  currentObject.set(CONST_OBJ_GLB_ENCR, block.getFieldValue('encryption'));
  ObjectMap.set(objectName, currentObject);

  javascriptGenerator.statementToCode(block, 'data_object_wrapper_with_encryption');

  return '';
};

javascriptGenerator.forBlock['data_object_field_wrapper'] = function (block) {
  const objectName = block.getField('object_name')!.getText();
  currentField = new Map();
  currentObject.set(objectName, currentField);

  javascriptGenerator.statementToCode(block, 'input');

  return '';
};

javascriptGenerator.forBlock['data_object_field_type'] = function (block) {
  const objectName = block.getFieldValue('object_type');
  currentField['type'] = objectName;

  javascriptGenerator.statementToCode(block, 'input');

  return '';
};

javascriptGenerator.forBlock['data_object_field_encryption'] = function (block) {
  const objectName = block.getFieldValue('object_type');
  currentField['encryption'] = objectName; // encryption

  javascriptGenerator.statementToCode(block, 'input');

  return '';
};
