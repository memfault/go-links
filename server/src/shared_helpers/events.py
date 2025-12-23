from flask_login import current_user

import datetime
import logging
import time
import uuid

try:
  from commercial.events import EVENT_HANDLERS
except ModuleNotFoundError:
  EVENT_HANDLERS = None


def handle_link_follow_created(event_object):
  """Handler that increments visits_count when a link is accessed."""
  link_id = None
  try:
    if event_object.get('type') != 'link_follow.created':
      return

    link_id = event_object.get('data', {}).get('object', {}).get('link_id')
    if not link_id:
      logging.info('handle_link_follow_created: No link_id in event object. Event: %s', event_object)
      return

    from modules.data import get_models
    models = get_models('links')
    link = models.ShortLink.get_by_id(int(link_id))
    
    if not link:
      logging.warning('handle_link_follow_created: Link with id %s not found', link_id)
      return

    # Increment visits_count, handling None as 0
    old_count = link.visits_count or 0
    link.visits_count = old_count + 1
    link.visits_count_last_updated = datetime.datetime.utcnow()
    link.put()
    logging.info('handle_link_follow_created: Updated visit count for link %s from %s to %s', link_id, old_count, link.visits_count)
  except Exception as e:
    logging.warning('Failed to update visit count for link %s: %s', link_id, str(e), exc_info=True)


_DEFAULT_EVENT_HANDLERS = [handle_link_follow_created]


def enqueue_event(org_id, event_type, object_type, object_data, timestamp=None, user=None):
  event_timestamp = timestamp or time.time()
  event_id = uuid.uuid4().hex

  object_data['object'] = object_type

  event_object = {'id': event_id,
                  'type': event_type,
                  'created': event_timestamp,
                  'organization': org_id,
                  'data': {'object': object_data}}

  user_for_event = user or current_user

  if user_for_event and hasattr(user_for_event, 'email'):
    event_object['data']['user'] = {'object': 'user',
                                    'email': user_for_event.email}

  # Call commercial handlers if they exist
  if EVENT_HANDLERS:
    for handler in EVENT_HANDLERS:
      handler(event_object)

  # Call default handlers (including visit count handler)
  logging.info('enqueue_event: Calling %d default handlers for event type %s', len(_DEFAULT_EVENT_HANDLERS), event_type)
  for handler in _DEFAULT_EVENT_HANDLERS:
    handler(event_object)
