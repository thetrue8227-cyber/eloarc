import LegalLayout from '../components/LegalLayout';

const SECTIONS = ['what', 'essential', 'preference', 'manage', 'consent'];

export default function Cookies() {
  return (
    <LegalLayout
      titleKey="cookies.title"
      introKey="cookies.intro"
      sectionsKey="cookies.sections"
      sectionOrder={SECTIONS}
    />
  );
}
