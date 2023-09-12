import { javascriptGenerator } from 'blockly/javascript';

/// TERMINUS STRUCTURE
const CONST_OBJ_GLB_ENCR = '_trm_globalEncrpt_';
const ObjectMap = new Map();
let currentObject, currentField;

const IGNORE_FIELDS = [CONST_OBJ_GLB_ENCR];

// TODO this must come from CUE and the regexp are hacked here for generation
const simpleRegex = '^[a-zA-Z]+$';
const regexMap = {
  'defs.#Letters': simpleRegex,
  'defs.#LettersWithSpaces': simpleRegex,
  'defs.#Alphanumerical': simpleRegex,
  'defs.#AlphanumericalWithSpaces': simpleRegex,
  'defs.#AlphanumericalNotAccented': simpleRegex,
  'defs.#AlphanumericalNotAccentedWithSpaces': simpleRegex,
  'defs.#SimpleDateFormat': '^20[0-9]{2}-[0-1][1-2]-[0-2][1-8]$', // regex restricted.
};

export const generateModel = (workspace, roles: string[]) => {
  ObjectMap.clear();

  javascriptGenerator['data_object_field_mask'] = function (block) {
    for (let i = 0; i < roles.length; i++) {
      const objName = block.getFieldValue(`object_type_${roles[i]}`);
      currentField[2 + i] = objName; // mask
    }

    javascriptGenerator.statementToCode(block, 'input', javascriptGenerator.ORDER_NONE);

    return '';
  };

  // trigger the BLOCKLY processing which will run our custom code generation
  javascriptGenerator.workspaceToCode(workspace);
  const ret = generateCUEStructure(roles);

  // add specific BoxyHQ imports
  return `
  EncryptedDefinitions: ${JSON.stringify(ret[1])}
  ${ret[0]}
  `;
};

// Rudimentary way of generating a CUE file
const generateCUEStructure = (roles: string[]) => {
  let defs = ``;
  const encrObjects = [];
  for (const [key, value] of Object.entries(Object.fromEntries(ObjectMap))) {
    encrObjects.push(key as never);
    const valuesMap = Object.fromEntries(value as any);

    // DEFINITIONS
    let definitions = ``;
    for (const [field, values] of Object.entries(valuesMap)) {
      if (IGNORE_FIELDS.includes(field)) {
        continue;
      }
      definitions += `\n\t\t\t${field}: ${values[0]}`;

      let pattern = regexMap[values[0]];
      if (pattern == null) {
        pattern = '.*';
      }
    }

    // ENCRYPTION
    let encryption = ``;
    if (valuesMap[CONST_OBJ_GLB_ENCR] != null) {
      encryption += `${valuesMap[CONST_OBJ_GLB_ENCR]}`;
    } else {
      for (const [field, values] of Object.entries(valuesMap)) {
        encryption += `\n\t\t\t${field}: ${values[1]}`;
      }
      encryption = `{ ${encryption}
        }`;
    }

    // MASKS
    let maskString = '';
    for (const [field, values] of Object.entries(valuesMap)) {
      if (IGNORE_FIELDS.includes(field)) {
        continue;
      }
      let index = 2;
      for (const role of roles) {
        const maskKey = `#Mask_${role.toLowerCase()}`;
        const maskVal = `\n\t\t\t${field}: ${values.length > index ? values[index++] : 'masking.#MRedact'}`;
        maskString += `\n${maskKey}: { ${maskVal}
        }`;
      }
    }
    const objectOutput = `\n#${key}: {
        #Definition: { ${definitions}
        }
        #Encryption: ${encryption}${maskString}
      }`;
    defs += objectOutput;
  }

  return [defs, encrObjects];
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

  javascriptGenerator.statementToCode(block, 'input', javascriptGenerator.ORDER_NONE);

  return '';
};

javascriptGenerator['data_object_field_type'] = function (block) {
  const objectName = block.getFieldValue('object_type');
  currentField[0] = objectName; // type
  currentField[2] = 'masking.#MRedact'; // mask
  currentField[3] = 'masking.#MRedact'; // mask

  javascriptGenerator.statementToCode(block, 'input', javascriptGenerator.ORDER_NONE);

  return '';
};

javascriptGenerator['data_object_field_default_types'] = javascriptGenerator['data_object_field_type'];

javascriptGenerator['data_object_field_encryption'] = function (block) {
  const objectName = block.getFieldValue('object_type');
  currentField[1] = objectName; // encryption

  javascriptGenerator.statementToCode(block, 'input', javascriptGenerator.ORDER_NONE);

  return '';
};
