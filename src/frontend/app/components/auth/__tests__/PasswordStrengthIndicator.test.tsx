import React from 'react';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator';

describe('PasswordStrengthIndicator', () => {
    it('renders nothing when password is empty', () => {
        const { container } = render(<PasswordStrengthIndicator password="" />);
        expect(container.firstChild).toBeNull();
    });

    it('shows weak strength for simple passwords', () => {
        render(<PasswordStrengthIndicator password="abc" />);
        
        expect(screen.getByText('Schwach')).toBeInTheDocument();
        expect(screen.getByText('Passwort-Stärke')).toBeInTheDocument();
    });

    it('shows requirements checklist', () => {
        render(<PasswordStrengthIndicator password="password" />);
        
        expect(screen.getByText('Anforderungen:')).toBeInTheDocument();
        expect(screen.getByText('Mindestens 8 Zeichen')).toBeInTheDocument();
        expect(screen.getByText('Klein- und Großbuchstaben')).toBeInTheDocument();
        expect(screen.getByText('Mindestens eine Zahl')).toBeInTheDocument();
        expect(screen.getByText('Mindestens ein Sonderzeichen')).toBeInTheDocument();
    });

    it('marks length requirement as met for 8+ character passwords', () => {
        render(<PasswordStrengthIndicator password="password" />);
        
        // Check if the checkmark SVG is present for length requirement
        const lengthRequirement = screen.getByText('Mindestens 8 Zeichen').closest('li');
        expect(lengthRequirement?.querySelector('svg[class*="text-green-500"]')).toBeInTheDocument();
    });

    it('marks length requirement as not met for short passwords', () => {
        render(<PasswordStrengthIndicator password="pass" />);
        
        // Check if the X mark SVG is present for length requirement
        const lengthRequirement = screen.getByText('Mindestens 8 Zeichen').closest('li');
        expect(lengthRequirement?.querySelector('svg[class*="text-gray-400"]')).toBeInTheDocument();
    });

    it('marks case requirement as met for mixed case passwords', () => {
        render(<PasswordStrengthIndicator password="Password" />);
        
        const caseRequirement = screen.getByText('Klein- und Großbuchstaben').closest('li');
        expect(caseRequirement?.querySelector('svg[class*="text-green-500"]')).toBeInTheDocument();
    });

    it('marks number requirement as met when password contains numbers', () => {
        render(<PasswordStrengthIndicator password="password123" />);
        
        const numberRequirement = screen.getByText('Mindestens eine Zahl').closest('li');
        expect(numberRequirement?.querySelector('svg[class*="text-green-500"]')).toBeInTheDocument();
    });

    it('marks special character requirement as met when password contains special chars', () => {
        render(<PasswordStrengthIndicator password="password!" />);
        
        const specialRequirement = screen.getByText('Mindestens ein Sonderzeichen').closest('li');
        expect(specialRequirement?.querySelector('svg[class*="text-green-500"]')).toBeInTheDocument();
    });

    it('shows fair strength for moderately complex passwords', () => {
        render(<PasswordStrengthIndicator password="Password1" />);
        
        expect(screen.getByText('Ausreichend')).toBeInTheDocument();
    });

    it('shows good strength for complex passwords', () => {
        render(<PasswordStrengthIndicator password="Password123!" />);
        
        expect(screen.getByText('Gut')).toBeInTheDocument();
    });

    it('shows strong strength for very complex passwords', () => {
        render(<PasswordStrengthIndicator password="MyVerySecurePassword123!" />);
        
        expect(screen.getByText('Sehr stark')).toBeInTheDocument();
    });

    it('updates strength when password changes', () => {
        const { rerender } = render(<PasswordStrengthIndicator password="weak" />);
        expect(screen.getByText('Schwach')).toBeInTheDocument();
        
        rerender(<PasswordStrengthIndicator password="StrongPassword123!" />);
        expect(screen.getByText('Sehr stark')).toBeInTheDocument();
    });

    it('applies correct color classes for different strength levels', () => {
        const { rerender } = render(<PasswordStrengthIndicator password="weak" />);
        expect(screen.getByText('Schwach')).toHaveClass('text-red-600');
        
        rerender(<PasswordStrengthIndicator password="Password1" />);
        expect(screen.getByText('Ausreichend')).toHaveClass('text-yellow-600');
        
        rerender(<PasswordStrengthIndicator password="Password123!" />);
        expect(screen.getByText('Gut')).toHaveClass('text-blue-600');
        
        rerender(<PasswordStrengthIndicator password="VeryStrongPassword123!" />);
        expect(screen.getByText('Sehr stark')).toHaveClass('text-green-600');
    });

    it('shows progress bar that reflects password strength', () => {
        render(<PasswordStrengthIndicator password="Password123!" />);
        
        // The progress bar should be present
        const progressBar = document.querySelector('.bg-blue-500');
        expect(progressBar).toBeInTheDocument();
    });
});