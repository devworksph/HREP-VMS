import { inject } from '@angular/core';
import type { Environment } from '~core/tokens/environment.token';
import { ENVIRONMENT } from '~core/tokens/environment.token';

export const getEndpoints = () => {
  const environment = inject<Environment>(ENVIRONMENT);
  const POKEMON_API_HOST = 'https://pokeapi.co/api';
  
  return false;
};
