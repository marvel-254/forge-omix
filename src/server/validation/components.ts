import { z } from 'zod'

export const ButtonPropsSchema = z.object({
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost', 'link']).optional(),
  size: z.enum(['sm', 'md', 'lg']).optional(),
  disabled: z.boolean().optional(),
  label: z.string().optional(),
  icon: z.string().optional(),
}).passthrough()

export const InputPropsSchema = z.object({
  type: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  value: z.unknown().optional(),
  label: z.string().optional(),
}).passthrough()

export const CardPropsSchema = z.object({
  variant: z.string().optional(),
  header: z.unknown().optional(),
  content: z.unknown().optional(),
  footer: z.unknown().optional(),
  elevation: z.number().optional(),
}).passthrough()

export const NavbarPropsSchema = z.object({
  logo: z.unknown().optional(),
  links: z.unknown().optional(),
  sticky: z.boolean().optional(),
  transparent: z.boolean().optional(),
}).passthrough()

export const ChartPropsSchema = z.object({
  type: z.enum(['line', 'bar', 'pie', 'doughnut', 'area']).optional(),
  data: z.unknown().optional(),
  options: z.unknown().optional(),
  responsive: z.boolean().optional(),
}).passthrough()

export const TablePropsSchema = z.object({
  columns: z.unknown().optional(),
  data: z.unknown().optional(),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  pagination: z.unknown().optional(),
}).passthrough()

export const componentPropSchemas = {
  Button: ButtonPropsSchema,
  Input: InputPropsSchema,
  Card: CardPropsSchema,
  Navbar: NavbarPropsSchema,
  Chart: ChartPropsSchema,
  Table: TablePropsSchema,
} as const

export type ComponentPropSchemas = typeof componentPropSchemas
