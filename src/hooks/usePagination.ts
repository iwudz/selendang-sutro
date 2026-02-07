import { useState, useMemo } from 'react';

interface UsePaginationOptions {
    initialPageSize?: number;
}

export function usePagination<T>(
    items: T[],
    options: UsePaginationOptions = {}
) {
    const { initialPageSize = 20 } = options;
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const totalPages = Math.ceil(items.length / pageSize);
    const totalItems = items.length;

    const currentItems = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return items.slice(startIndex, startIndex + pageSize);
    }, [items, currentPage, pageSize]);

    const goToPage = (page: number) => {
        const pageNumber = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(pageNumber);
    };

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const setPageSizeFn = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    return {
        currentPage,
        pageSize,
        totalPages,
        totalItems,
        currentItems,
        goToPage,
        nextPage,
        prevPage,
        setPageSize: setPageSizeFn,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
    };
}

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
}

export function PaginationControls({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100]
}: PaginationControlsProps) {
    if (totalPages <= 1 && !onPageSizeChange) {
        return null;
    }

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const selectOptions = pageSizeOptions.map(size => 
        `${size} per halaman`
    );

    return {
        startItem,
        endItem,
        selectOptions,
        pageSizeOptions,
        _onPageChange: onPageChange
    };
}
