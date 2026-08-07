import { builder } from './builder'
import './entities/member'
import './entities/profile'

/**
 * The executable schema. Entity modules are imported for their registration
 * side effects before `toSchema()` runs; add new entities to this import list
 * as the graph grows (re-pointed onto v2, feature by feature).
 */
export const schema = builder.toSchema()
