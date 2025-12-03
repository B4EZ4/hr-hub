import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';

export const VacanciesActionButton = () => {
  return (
    <Link to="/areas/vacantes">
      <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-chart-1/5" data-testid="vacancies-action-button">
        <Briefcase className="mr-3 h-5 w-5 text-chart-1" />
        <div className="text-left">
          <div className="font-semibold">Vacantes</div>
          <div className="text-xs text-muted-foreground">Posiciones abiertas</div>
        </div>
      </Button>
    </Link>
  );
};

export default VacanciesActionButton;
