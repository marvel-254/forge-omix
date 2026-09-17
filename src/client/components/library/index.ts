import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Navbar } from '../ui/Navbar';
import { Chart } from '../ui/Chart';
import { Table } from '../ui/Table';

// Component registry
const componentRegistry = {
  Button,
  Input,
  Card,
  Navbar,
  Chart,
  Table
};

export type ComponentType = keyof typeof componentRegistry;

export function getComponent(type: ComponentType) {
  return componentRegistry[type];
}

export function getComponentList() {
  return Object.keys(componentRegistry) as ComponentType[];
}
