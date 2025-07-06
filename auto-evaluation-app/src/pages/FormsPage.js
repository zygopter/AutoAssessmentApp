import React from 'react';
import { Spinner } from '../components/ui/spinner';
import { useCompetences } from '../contexts/CompetencesContext';
import { ErrorBanner } from '../components/ui/error-banner';
import FormsTabContent from '../components/FormsTab';

const FormsPage = () => {
  const { isLoading, error } = useCompetences();

  if (isLoading) return <Spinner />;
  return (
    <>
      {error && <ErrorBanner message={error} />}
      <FormsTabContent />
    </>
  );
};

export default FormsPage;
