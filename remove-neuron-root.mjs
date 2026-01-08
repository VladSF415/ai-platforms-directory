#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const platforms = JSON.parse(readFileSync('platforms.json', 'utf-8'));
console.log('Before:', platforms.length, 'platforms');

const neuronIndex = platforms.findIndex(p =>
  p.id === 'neuron' || (p.name && p.name.toLowerCase() === 'neuron')
);

if (neuronIndex !== -1) {
  console.log('Found Neuron at index', neuronIndex);
  console.log('Removing:', platforms[neuronIndex].name, '-', platforms[neuronIndex].url);
  platforms.splice(neuronIndex, 1);
  writeFileSync('platforms.json', JSON.stringify(platforms, null, 2));
  console.log('After:', platforms.length, 'platforms');
  console.log('✅ Removed Neuron and saved to ROOT platforms.json');
} else {
  console.log('❌ Neuron not found');
}
