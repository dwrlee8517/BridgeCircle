import { builder } from './builder'
import './entities/member'
import './entities/open-ask'

/**
 * The executable schema. Entity modules are imported for their registration
 * side effects before `toSchema()` runs; add new entities to this import list
 * as the graph grows.
 */
export const schema = builder.toSchema()
