import React from 'react';
import { DashboardView } from './DashboardView';

interface ReadOnlyStudentViewModalProps {
  studentDetail: {
    student: {
      id?: string;
      fullName: string;
      regNumber: string;
      section?: string;
      batch?: string;
      branch?: string;
    };
    timetable?: Record<string, any>;
    labs?: Record<string, any>;
    attendance?: Record<string, any>;
  };
  onClose: () => void;
}

export const ReadOnlyStudentViewModal: React.FC<ReadOnlyStudentViewModalProps> = ({
  studentDetail,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md p-3 sm:p-6 animate-fadeIn">
      <div className="max-w-6xl mx-auto bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-2xl p-6 shadow-2xl relative">
        <DashboardView
          readOnlyData={studentDetail}
          isReadOnly={true}
          onCloseReadOnly={onClose}
        />
      </div>
    </div>
  );
};
