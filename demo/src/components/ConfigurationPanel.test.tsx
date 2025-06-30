/**
 * ConfigurationPanel Component Tests
 * 
 * Tests the live configuration panel that allows users to experiment
 * with StoryScroller settings in real-time.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ConfigurationPanel } from './ConfigurationPanel'

describe('ConfigurationPanel Component', () => {
  let mockStoryScrollerAPI: any;
  
  beforeEach(() => {
    // Mock the global StoryScroller API
    mockStoryScrollerAPI = {
      updateConfig: vi.fn(),
      getState: vi.fn(() => ({
        currentSection: 0,
        isAnimating: false,
      })),
    };
    
    (window as any).storyScrollerAPI = mockStoryScrollerAPI;
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).storyScrollerAPI;
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(<ConfigurationPanel />);
      }).not.toThrow();
    });

    it('displays toggle button initially', () => {
      render(<ConfigurationPanel />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle configuration panel/i });
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveTextContent('⚙️ Config');
    });

    it('does not show configuration content initially', () => {
      render(<ConfigurationPanel />);
      
      expect(screen.queryByText('Live Configuration')).not.toBeInTheDocument();
      expect(screen.queryByText('Duration:')).not.toBeInTheDocument();
    });
  });

  describe('Panel Toggle Behavior', () => {
    it('opens configuration panel when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfigurationPanel />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle configuration panel/i });
      await user.click(toggleButton);
      
      expect(screen.getByText('Live Configuration')).toBeInTheDocument();
      expect(screen.getByText(/Duration:/)).toBeInTheDocument();
    });

    it('closes configuration panel when toggle button is clicked again', async () => {
      const user = userEvent.setup();
      render(<ConfigurationPanel />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle configuration panel/i });
      
      // Open panel
      await user.click(toggleButton);
      expect(screen.getByText('Live Configuration')).toBeInTheDocument();
      
      // Close panel
      await user.click(toggleButton);
      expect(screen.queryByText('Live Configuration')).not.toBeInTheDocument();
    });

    it('has proper aria-expanded attribute', async () => {
      const user = userEvent.setup();
      render(<ConfigurationPanel />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle configuration panel/i });
      
      // Initially closed
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      
      // Open panel
      await user.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Configuration Controls', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ConfigurationPanel />);
      
      // Open the panel
      const toggleButton = screen.getByRole('button', { name: /toggle configuration panel/i });
      await user.click(toggleButton);
    });

    it('displays all configuration controls', () => {
      expect(screen.getByLabelText(/Duration:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Sensitivity:/)).toBeInTheDocument();
      expect(screen.getByLabelText('Magnetic Snap')).toBeInTheDocument();
      expect(screen.getByLabelText(/Snap Threshold:/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apply Changes' })).toBeInTheDocument();
    });

    it('has proper default values', () => {
      const durationSlider = screen.getByLabelText(/Duration:/) as HTMLInputElement;
      const sensitivitySlider = screen.getByLabelText(/Sensitivity:/) as HTMLInputElement;
      const magneticCheckbox = screen.getByLabelText('Magnetic Snap') as HTMLInputElement;
      const thresholdSlider = screen.getByLabelText(/Snap Threshold:/) as HTMLInputElement;
      
      expect(durationSlider.value).toBe('1.2');
      expect(sensitivitySlider.value).toBe('50');
      expect(magneticCheckbox.checked).toBe(true);
      expect(thresholdSlider.value).toBe('0.15');
    });

    it('updates duration value when slider is moved', async () => {
      const user = userEvent.setup();
      const durationSlider = screen.getByLabelText(/Duration:/) as HTMLInputElement;
      
      await user.clear(durationSlider);
      await user.type(durationSlider, '0.8');
      
      expect(screen.getByText('Duration: 0.8s')).toBeInTheDocument();
    });

    it('updates sensitivity value when slider is moved', async () => {
      const user = userEvent.setup();
      const sensitivitySlider = screen.getByLabelText(/Sensitivity:/) as HTMLInputElement;
      
      fireEvent.change(sensitivitySlider, { target: { value: '75' } });
      
      expect(screen.getByText('Sensitivity: 75')).toBeInTheDocument();
    });

    it('toggles magnetic snap checkbox', async () => {
      const user = userEvent.setup();
      const magneticCheckbox = screen.getByLabelText('Magnetic Snap') as HTMLInputElement;
      
      expect(magneticCheckbox.checked).toBe(true);
      
      await user.click(magneticCheckbox);
      expect(magneticCheckbox.checked).toBe(false);
    });

    it('disables threshold slider when magnetic snap is off', async () => {
      const user = userEvent.setup();
      const magneticCheckbox = screen.getByLabelText('Magnetic Snap');
      const thresholdSlider = screen.getByLabelText(/Snap Threshold:/);
      
      // Initially enabled
      expect(thresholdSlider).not.toBeDisabled();
      
      // Disable magnetic snap
      await user.click(magneticCheckbox);
      expect(thresholdSlider).toBeDisabled();
    });
  });

  describe('Configuration Application', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ConfigurationPanel />);
      
      // Open the panel
      const toggleButton = screen.getByRole('button', { name: /toggle configuration panel/i });
      await user.click(toggleButton);
    });

    it('calls StoryScroller API when Apply Changes is clicked', async () => {
      const user = userEvent.setup();
      const applyButton = screen.getByRole('button', { name: 'Apply Changes' });
      
      await user.click(applyButton);
      
      expect(mockStoryScrollerAPI.updateConfig).toHaveBeenCalledWith({
        duration: 1.2,
        tolerance: 50,
        enableMagneticSnap: true,
        magneticThreshold: 0.15,
      });
    });

    it('applies updated configuration values', async () => {
      const user = userEvent.setup();
      
      // Change some values
      const durationSlider = screen.getByLabelText(/Duration:/);
      fireEvent.change(durationSlider, { target: { value: '2.0' } });
      
      const sensitivitySlider = screen.getByLabelText(/Sensitivity:/);
      fireEvent.change(sensitivitySlider, { target: { value: '80' } });
      
      const applyButton = screen.getByRole('button', { name: 'Apply Changes' });
      await user.click(applyButton);
      
      expect(mockStoryScrollerAPI.updateConfig).toHaveBeenCalledWith({
        duration: 2.0,
        tolerance: 80,
        enableMagneticSnap: true,
        magneticThreshold: 0.15,
      });
    });

    it('handles missing StoryScroller API gracefully', async () => {
      const user = userEvent.setup();
      
      // Remove the API
      delete (window as any).storyScrollerAPI;
      
      const applyButton = screen.getByRole('button', { name: 'Apply Changes' });
      
      expect(() => {
        user.click(applyButton);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ConfigurationPanel />);
      
      // Open the panel
      const toggleButton = screen.getByRole('button', { name: /toggle configuration panel/i });
      await user.click(toggleButton);
    });

    it('has proper form labels', () => {
      expect(screen.getByLabelText(/Duration:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Sensitivity:/)).toBeInTheDocument();
      expect(screen.getByLabelText('Magnetic Snap')).toBeInTheDocument();
      expect(screen.getByLabelText(/Snap Threshold:/)).toBeInTheDocument();
    });

    it('has descriptive help text for controls', () => {
      expect(screen.getByText('Animation duration in seconds')).toBeInTheDocument();
      expect(screen.getByText('Input sensitivity threshold')).toBeInTheDocument();
      expect(screen.getByText('Automatic snapping to sections')).toBeInTheDocument();
      expect(screen.getByText('Distance threshold for magnetic snap')).toBeInTheDocument();
    });

    it('associates help text with controls via aria-describedby', () => {
      const durationSlider = screen.getByLabelText(/Duration:/);
      expect(durationSlider).toHaveAttribute('aria-describedby', 'duration-help');
      
      const sensitivitySlider = screen.getByLabelText(/Sensitivity:/);
      expect(sensitivitySlider).toHaveAttribute('aria-describedby', 'tolerance-help');
      
      const thresholdSlider = screen.getByLabelText(/Snap Threshold:/);
      expect(thresholdSlider).toHaveAttribute('aria-describedby', 'threshold-help');
    });

    it('has proper input ranges and steps', () => {
      const durationSlider = screen.getByLabelText(/Duration:/) as HTMLInputElement;
      expect(durationSlider.min).toBe('0.2');
      expect(durationSlider.max).toBe('2');
      expect(durationSlider.step).toBe('0.1');
      
      const sensitivitySlider = screen.getByLabelText(/Sensitivity:/) as HTMLInputElement;
      expect(sensitivitySlider.min).toBe('10');
      expect(sensitivitySlider.max).toBe('100');
      expect(sensitivitySlider.step).toBe('5');
    });
  });

  describe('State Management', () => {
    it('maintains state during panel open/close', async () => {
      const user = userEvent.setup();
      render(<ConfigurationPanel />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle configuration panel/i });
      
      // Open panel and change a value
      await user.click(toggleButton);
      const durationSlider = screen.getByLabelText(/Duration:/);
      fireEvent.change(durationSlider, { target: { value: '1.8' } });
      
      // Close panel
      await user.click(toggleButton);
      
      // Reopen panel
      await user.click(toggleButton);
      
      // Value should be preserved
      expect(screen.getByText('Duration: 1.8s')).toBeInTheDocument();
    });

    it('updates display values immediately on input change', async () => {
      const user = userEvent.setup();
      render(<ConfigurationPanel />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle configuration panel/i });
      await user.click(toggleButton);
      
      const thresholdSlider = screen.getByLabelText(/Snap Threshold:/);
      fireEvent.change(thresholdSlider, { target: { value: '0.25' } });
      
      expect(screen.getByText('Snap Threshold: 0.25')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('applies open class when panel is expanded', async () => {
      const user = userEvent.setup();
      render(<ConfigurationPanel />);
      
      const configPanel = document.querySelector('.config-panel');
      expect(configPanel).not.toHaveClass('open');
      
      const toggleButton = screen.getByRole('button', { name: /toggle configuration panel/i });
      await user.click(toggleButton);
      
      expect(configPanel).toHaveClass('open');
    });

    it('shows configuration content only when open', async () => {
      const user = userEvent.setup();
      render(<ConfigurationPanel />);
      
      expect(document.querySelector('.config-content')).not.toBeInTheDocument();
      
      const toggleButton = screen.getByRole('button', { name: /toggle configuration panel/i });
      await user.click(toggleButton);
      
      expect(document.querySelector('.config-content')).toBeInTheDocument();
    });
  });
});