const checkLicense = async (license: string | undefined): Promise<boolean> => {
  if (!license) {
    return false;
  }

  return license === 'dummy-license';
};

export default checkLicense;
