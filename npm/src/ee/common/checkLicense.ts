const checkLicense = async (license: string | undefined): Promise<boolean> => {
  console.info('Checking license...', license);

  if (!license) {
    return false;
  }

  return license === 'dummy-license';
};

export default checkLicense;
