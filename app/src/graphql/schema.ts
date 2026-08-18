import { builder } from './builder'
import './entities/connections'
import './entities/conversations'
import './entities/help'
import './entities/help-mutations'
import './entities/member'
import './entities/messages-commands'
import './entities/notifications'
import './entities/people'
import './entities/profile'
import './entities/school'

/**
 * The executable schema. Entity modules are imported for their registration
 * side effects before `toSchema()` runs; add new entities to this import list
 * as the graph grows (re-pointed onto v2, feature by feature).
 */
export const schema = builder.toSchema()
