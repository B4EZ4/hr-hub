import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

export const AreaActionButton = () => {
  return (
    <Link to="/areas/lista">
      <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-primary/5" data-testid="area-action-button">
        <Users className="mr-3 h-5 w-5 text-primary" />
        <div className="text-left">
          <div className="font-semibold">Gestionar Áreas</div>
          <div className="text-xs text-muted-foreground">Estructura organizacional</div>
        </div>
      </Button>
    </Link>
  );
};

export default AreaActionButton;
