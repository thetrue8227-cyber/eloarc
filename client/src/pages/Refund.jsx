import LegalLayout from '../components/LegalLayout';

const SECTIONS = ['policy', 'how', 'processing', 'after', 'exceptions'];

export default function Refund() {
  return (
    <LegalLayout
      titleKey="refund.title"
      introKey="refund.intro"
      sectionsKey="refund.sections"
      sectionOrder={SECTIONS}
    />
  );
}
