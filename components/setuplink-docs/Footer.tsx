import NextButton from '@components/setuplink-docs/NextButton';
import PreviousButton from '@components/setuplink-docs/PreviousButton';

interface FooterProps {
  hasNext?: boolean;
}

const Footer = ({ hasNext = true }: FooterProps) => {
  return (
    <div className='flex justify-between items-center py-4'>
      <PreviousButton />
      {hasNext && <NextButton />}
    </div>
  );
};

export default Footer;
