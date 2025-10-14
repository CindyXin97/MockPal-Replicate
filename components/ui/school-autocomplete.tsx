'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { SCHOOLS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SchoolAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SchoolAutocomplete({
  value,
  onChange,
  placeholder = "请输入学校名称",
  className,
  disabled = false
}: SchoolAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSchools, setFilteredSchools] = useState(SCHOOLS);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 初始化输入值
  useEffect(() => {
    if (value) {
      // 如果value是学校key，找到对应的label
      const school = SCHOOLS.find(s => s.value === value);
      setInputValue(school ? school.label : value);
    }
  }, [value]);

  // 过滤学校列表
  const filterSchools = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return SCHOOLS;
    }
    
    return SCHOOLS.filter(school =>
      school.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // 过滤学校列表
    const filtered = filterSchools(newValue);
    setFilteredSchools(filtered);
    
    // 显示建议
    setShowSuggestions(true);
    setSelectedIndex(-1);
    
    // 如果没有匹配的学校，直接使用输入值
    if (filtered.length === 0) {
      onChange(newValue);
    }
  };

  // 处理学校选择
  const handleSchoolSelect = (school: typeof SCHOOLS[0]) => {
    setInputValue(school.label);
    onChange(school.value);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSchools.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSchools.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSchools.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredSchools.length) {
          handleSchoolSelect(filteredSchools[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 处理焦点事件
  const handleFocus = () => {
    setShowSuggestions(true);
    // 如果输入为空，显示所有学校
    if (!inputValue.trim()) {
      setFilteredSchools(SCHOOLS);
    }
  };

  const handleBlur = () => {
    // 延迟隐藏，让点击事件先触发
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />
      
      {showSuggestions && filteredSchools.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSchools.map((school, index) => (
            <div
              key={school.value}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm transition-colors",
                "hover:bg-gray-50",
                index === selectedIndex && "bg-blue-50 text-blue-600"
              )}
              onClick={() => handleSchoolSelect(school)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="font-medium">{school.label}</div>
            </div>
          ))}
          
          {/* 如果没有匹配的学校，显示自定义选项 */}
          {filteredSchools.length === 0 && inputValue.trim() && (
            <div
              className="px-3 py-2 cursor-pointer text-sm text-gray-500 hover:bg-gray-50"
              onClick={() => {
                onChange(inputValue);
                setShowSuggestions(false);
              }}
            >
              使用自定义学校名称: "{inputValue}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
