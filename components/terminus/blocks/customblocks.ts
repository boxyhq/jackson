import Blockly from 'blockly/core';

// TODO wire with CUE configuration files
// TODO extract prefixes
function getEncryption() {
  return [
    ['AES_256', 'crypto.#EnAES_256'],
    ['FPE_FF1', 'crypto.#EnFPE_FF1'],
    ['FPE_FF3_1', 'crypto.#EnFPE_FF3_1'],
    ['NoEncryption', 'crypto.#EnNoEncryption'],
    // ['RSA_2048', 'crypto.#EnRSA_2048'],
    // ['Blowfish_448', 'crypto.#EnBlowfish_448'],
    // ['FPE', 'crypto.#EnFPE'],
    // ['B64', 'crypto.#EnB64'],
  ];
}
function getMasks() {
  return [
    ['Clear', 'masking.#MClear'],
    ['Generic', 'masking.#MGeneric'],
    ['Redact', 'masking.#MRedact'],
    ['Password', 'masking.#MPassword'],
    ['Name', 'masking.#MName'],
    ['Address', 'masking.#MAddress'],
    ['Email', 'masking.#MEmail'],
    ['Mobile', 'masking.#MMobile'],
    ['Telephone', 'masking.#MTelephone'],
    ['ID', 'masking.#MID'],
    ['CreditCard', 'masking.#MCreditCard'],
    ['Struct', 'masking.#MStruct'],
    ['URL', 'masking.#MURL'],
  ];
}
function getPredefinedDataTypes() {
  return [
    ['Letters', 'defs.#Letters'],
    ['LettersWithSpaces', 'defs.#LettersWithSpaces'],
    ['Alphanumerical', 'defs.#Alphanumerical'],
    ['AlphanumericalWithSpaces', 'defs.#AlphanumericalWithSpaces'],
    ['AlphanumericalNotAccented', 'defs.#AlphanumericalNotAccented'],
    ['AlphanumericalNotAccentedWithSpaces', 'defs.#AlphanumericalNotAccentedWithSpaces'],
    ['SimpleDate (2006-11-24)', 'defs.#SimpleDateFormat'],
  ];
}

/////////////////////////////////////////////////////////////////////
// Terminus UI Blocks
Blockly.Blocks['data_object_wrapper'] = {
  init: function () {
    this.jsonInit({
      type: 'data_object_wrapper',
      message0: '%1 %2',
      args0: [
        {
          type: 'field_input',
          name: 'object_name',
          text: 'Object Name',
        },
        {
          type: 'input_statement',
          name: 'data_object_wrapper',
        },
      ],
      inputsInline: false,
      colour: 150,
      tooltip: 'data object wrapper',
      helpUrl: 'https://github.com/boxyhq/terminus-ui/help/data_object_wrapper',
    });
    // this.setStyle('loop_blocks');
  },
};

Blockly.Blocks['data_object_wrapper_with_encryption'] = {
  init: function () {
    this.jsonInit({
      type: 'data_object_wrapper_with_encryption',
      message0: '%1 %2 Encryption: %3',
      args0: [
        {
          type: 'field_input',
          name: 'object_name',
          text: 'Object Name',
        },
        {
          type: 'input_statement',
          name: 'data_object_wrapper',
        },
        {
          type: 'field_dropdown',
          name: 'encryption',
          options: getEncryption(),
        },
      ],
      inputsInline: false,
      colour: 150,
      tooltip: '',
      helpUrl: '',
    });
  },
};

Blockly.Blocks['data_object_field_wrapper'] = {
  init: function () {
    this.jsonInit({
      type: 'data_object_field_wrapper',
      message0: 'Field %1 %2',
      args0: [
        {
          type: 'field_input',
          name: 'field_name',
          text: '<name>',
        },
        {
          type: 'input_value',
          name: 'input',
          check: 'String',
        },
      ],
      inputsInline: false,
      previousStatement: null,
      nextStatement: null,
      colour: 230,
      tooltip: '',
      helpUrl: 'https://github.com/boxyhq/terminus-ui/help/data_object_field_wrapper',
    });
    // this.setStyle('loop_blocks');
  },
};

Blockly.Blocks['data_object_field_type'] = {
  init: function () {
    this.jsonInit({
      type: 'data_object_field_type',
      message0: 'type %1 %2',
      args0: [
        {
          type: 'field_input',
          name: 'object_type',
          text: 'string',
        },
        {
          type: 'input_value',
          name: 'input',
          check: ['Boolean', 'String'],
        },
      ],
      output: null,
      colour: 230,
      tooltip: '',
      helpUrl: '',
    });
    // this.setStyle('loop_blocks');
  },
};

Blockly.Blocks['data_object_field_default_types'] = {
  init: function () {
    this.jsonInit({
      type: 'data_object_field_default_types',
      message0: 'type %1 %2',
      args0: [
        {
          type: 'field_dropdown',
          name: 'object_type',
          options: getPredefinedDataTypes(),
        },
        {
          type: 'input_value',
          name: 'input',
          check: ['Boolean', 'String'],
        },
      ],
      output: null,
      colour: 230,
      tooltip: '',
      helpUrl: '',
    });
    // this.setStyle('loop_blocks');
  },
};

Blockly.Blocks['data_object_field_encryption'] = {
  init: function () {
    this.jsonInit({
      type: 'data_object_field_encryption',
      message0: 'encryption %1 %2',
      args0: [
        {
          type: 'field_dropdown',
          name: 'object_type',
          options: getEncryption(),
        },
        {
          type: 'input_value',
          name: 'input',
          check: ['Boolean', 'String'],
        },
      ],
      output: null,
      colour: 230,
      tooltip: '',
      helpUrl: '',
    });
    // this.setStyle('loop_blocks');
  },
};
Blockly.Blocks['data_object_field_mask'] = {
  init: function () {
    this.jsonInit({
      type: 'data_object_field_mask',
      message0: 'mask (Admin:%1) (Member:%2) %3',
      args0: [
        {
          type: 'field_dropdown',
          name: 'object_type_ADMIN',
          options: getMasks(),
        },
        {
          type: 'field_dropdown',
          name: 'object_type_MEMBER',
          options: getMasks(),
        },
        {
          type: 'input_value',
          name: 'object_type',
          check: ['Boolean', 'String'],
        },
      ],
      output: null,
      colour: 230,
      tooltip: '',
      helpUrl: '',
    });
  },
};

const capitalize = (s: string) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export const maskSetup = (roles: string[]) => {
  let maskMessage = 'mask (';
  const args: any[] = [];
  for (let i = 0; i < roles.length; i++) {
    maskMessage += `${capitalize(roles[i])}:%${i + 1}`;
    if (i < roles.length - 1) {
      maskMessage += ') (';
    }
    args.push({
      type: 'field_dropdown',
      name: `object_type_${roles[i]}`,
      options: getMasks(),
    });
  }
  Blockly.Blocks['data_object_field_mask'] = {
    init: function () {
      this.jsonInit({
        type: 'data_object_field_mask',
        message0: maskMessage + `) %${roles.length + 1}`,
        args0: [
          ...args,
          {
            type: 'input_value',
            name: 'object_type',
            check: ['Boolean', 'String'],
          },
        ],
        output: null,
        colour: 230,
        tooltip: '',
        helpUrl: '',
      });
    },
  };
};
