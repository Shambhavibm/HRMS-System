// frontend/components/ui/pagination/Pagination.jsx

import React from 'react';
import Button from '../../../components/ui/button/Button';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    if (totalPages <= 1) {
        return null; // Don't render pagination if there's only one page
    }

    return (
        <div className="flex items-center justify-between mt-4">
            <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentPage === 1}
            >
                Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentPage === totalPages}
            >
                Next
            </Button>
        </div>
    );
};

export default Pagination;