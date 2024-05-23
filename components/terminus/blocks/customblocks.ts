import * as Blockly from 'blockly/core';

function getEncryption() {
  return [
    ['AES_256', 'AES_256'],
    ['FPE_FF1', 'FPE_FF1'],
    ['FPE_FF3_1', 'FPE_FF3_1'],
    ['NoEncryption', 'NoEncryption'],
    // ['RSA_2048', 'RSA_2048'],
    // ['Blowfish_448', 'Blowfish_448'],
    // ['FPE', 'FPE'],
    // ['B64', 'B64'],
  ];
}

function getMasks() {
  return [
    ['Clear', 'Clear'],
    ['Redact', 'Redact'],
    ['Generic', 'Generic'],
    ['Password', 'Password'],
    ['Name', 'Name'],
    ['Address', 'Address'],
    ['Email', 'Email'],
    ['Mobile', 'Mobile'],
    ['Telephone', 'Telephone'],
    ['ID', 'ID'],
    ['CreditCard', 'CreditCard'],
    ['Struct', 'Struct'],
    ['URL', 'URL'],
  ];
}

function getPredefinedDataTypes() {
  return [
    ['String', 'String'],
    ['Letters', 'Letters'],
    ['LettersWithSpaces', 'LettersWithSpaces'],
    ['Alphanumerical', 'Alphanumerical'],
    ['AlphanumericalWithSpaces', 'AlphanumericalWithSpaces'],
    ['AlphanumericalNotAccented', 'AlphanumericalNotAccented'],
    ['AlphanumericalNotAccentedWithSpaces', 'AlphanumericalNotAccentedWithSpaces'],
    ['SimpleDate (2006-11-24)', 'Date'],
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
          type: 'field_dropdown',
          name: 'object_type',
          options: getPredefinedDataTypes(),
        },
        {
          type: 'input_value',
          name: 'input',
          check: 'String',
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
          check: 'String',
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
      message0: 'mask (admin:%1) (member:%2) %3',
      args0: [
        {
          type: 'field_dropdown',
          name: 'object_type_admin',
          options: getMasks(),
        },
        {
          type: 'field_dropdown',
          name: 'object_type_member',
          options: getMasks(),
        },
        {
          type: 'input_value',
          name: 'object_type',
          check: 'String',
        },
      ],
      output: null,
      colour: 230,
      tooltip: '',
      helpUrl: '',
    });
  },
};

export const maskSetup = (roles: string[]) => {
  let maskMessage = 'mask (';
  const args: any[] = [];
  for (let i = 0; i < roles.length; i++) {
    maskMessage += `${roles[i]}:%${i + 1}`;
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
            check: 'String',
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
