import { Injectable } from '@angular/core';
import { IWizardStep } from './form-wizard.model';

@Injectable({
  providedIn: 'root'
})
export class FormWizardService {
  private stepsData: { [key: number]: any } = {};
  private steps: IWizardStep[] = [];

  getSteps(): IWizardStep[] {
    return this.steps;
  }

  setSteps(config: IWizardStep[]): void {
    this.steps = config;
  }

  // Sets the data for a specific step
  setStepData(stepNumber: number, data: any): void {
    this.stepsData[stepNumber] = data;  // Store data for the given step number
    console.log(`Data for Step ${stepNumber} set successfully:`, data);
  }

  // Gets the data for a specific step
  getStepData(stepNumber: number): any {
    return this.stepsData[stepNumber];  // Retrieve data for the given step number
  }

  // Optionally get all stored data for debugging or final submission
  getAllStepData(): { [key: number]: any } {
    return this.stepsData;  // Return all step data
  }
}