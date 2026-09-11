import type {
  BioPlotDocument,
  GroupObject,
  ObjectId,
} from './document'

export class BioPlotDocumentIntegrityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BioPlotDocumentIntegrityError'
  }
}

function fail(message: string): never {
  throw new BioPlotDocumentIntegrityError(message)
}

function assertUnique(
  values: string[],
  label: string,
) {
  const seen = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) {
      fail(`Duplicate ${label}: "${value}"`)
    }

    seen.add(value)
  }
}

function isGroup(
  document: BioPlotDocument,
  objectId: ObjectId,
): GroupObject | null {
  const object = document.objects[objectId]

  if (!object || object.type !== 'group') {
    return null
  }

  return object
}

export function assertBioPlotDocumentIntegrity(
  document: BioPlotDocument,
): void {
  if (!document.id.trim()) {
    fail('Document id cannot be empty.')
  }

  if (!document.title.trim()) {
    fail('Document title cannot be empty.')
  }

  if (document.pages.length === 0) {
    fail('A BioPlot document must contain at least one page.')
  }

  const pageIds = document.pages.map(
    (page) => page.id,
  )

  assertUnique(pageIds, 'page id')

  const pageIdSet = new Set(pageIds)

  /*
   * Object map keys must always match object.id.
   */
  for (const [key, object] of Object.entries(
    document.objects,
  )) {
    if (key !== object.id) {
      fail(
        `Object map key "${key}" does not match object.id "${object.id}".`,
      )
    }

    if (!pageIdSet.has(object.pageId)) {
      fail(
        `Object "${object.id}" refers to missing page "${object.pageId}".`,
      )
    }

    if (
      object.opacity < 0 ||
      object.opacity > 1
    ) {
      fail(
        `Object "${object.id}" has invalid opacity ${object.opacity}.`,
      )
    }

    if (
      object.transform.width < 0 ||
      object.transform.height < 0
    ) {
      fail(
        `Object "${object.id}" cannot have negative dimensions.`,
      )
    }
  }

  /*
   * Validate root object lists.
   */
  for (const page of document.pages) {
    assertUnique(
      page.rootObjectIds,
      `root object id on page "${page.id}"`,
    )

    for (const objectId of page.rootObjectIds) {
      const object = document.objects[objectId]

      if (!object) {
        fail(
          `Page "${page.id}" refers to missing root object "${objectId}".`,
        )
      }

      if (object.pageId !== page.id) {
        fail(
          `Root object "${objectId}" belongs to another page.`,
        )
      }

      if (object.parentId !== null) {
        fail(
          `Root object "${objectId}" cannot have a parent.`,
        )
      }
    }
  }

  /*
   * Validate group relationships.
   */
  for (const object of Object.values(
    document.objects,
  )) {
    if (object.type === 'group') {
      assertUnique(
        object.childIds,
        `child id in group "${object.id}"`,
      )

      for (const childId of object.childIds) {
        const child = document.objects[childId]

        if (!child) {
          fail(
            `Group "${object.id}" refers to missing child "${childId}".`,
          )
        }

        if (child.id === object.id) {
          fail(
            `Group "${object.id}" cannot contain itself.`,
          )
        }

        if (child.parentId !== object.id) {
          fail(
            `Child "${childId}" does not point back to group "${object.id}".`,
          )
        }

        if (child.pageId !== object.pageId) {
          fail(
            `Child "${childId}" and group "${object.id}" must belong to the same page.`,
          )
        }
      }
    }

    if (object.parentId !== null) {
      const parent = isGroup(
        document,
        object.parentId,
      )

      if (!parent) {
        fail(
          `Object "${object.id}" refers to missing or invalid parent "${object.parentId}".`,
        )
      }

      if (!parent.childIds.includes(object.id)) {
        fail(
          `Parent group "${parent.id}" does not contain child "${object.id}".`,
        )
      }
    }
  }

  /*
   * Detect cyclic group relationships.
   *
   * A -> B -> C -> A must never be possible.
   */
  for (const object of Object.values(
    document.objects,
  )) {
    const visited = new Set<ObjectId>()

    let current = object

    while (current.parentId !== null) {
      if (visited.has(current.id)) {
        fail(
          `Circular group hierarchy detected at object "${current.id}".`,
        )
      }

      visited.add(current.id)

      const parent =
        document.objects[current.parentId]

      if (!parent) break

      current = parent
    }
  }

  /*
   * Every top-level object must occur exactly once
   * in its page's rootObjectIds list.
   */
  for (const object of Object.values(
    document.objects,
  )) {
    if (object.parentId !== null) continue

    const page = document.pages.find(
      (candidate) =>
        candidate.id === object.pageId,
    )

    if (!page) {
      fail(
        `Object "${object.id}" has no valid page.`,
      )
    }

    if (!page.rootObjectIds.includes(object.id)) {
      fail(
        `Top-level object "${object.id}" is missing from page "${page.id}".`,
      )
    }
  }

  /*
   * Validate connector references.
   */
  for (const object of Object.values(
    document.objects,
  )) {
    if (object.type !== 'connector') continue

    const endpoints = [
      object.start,
      object.end,
    ]

    for (const endpoint of endpoints) {
      if (endpoint.kind !== 'object') {
        continue
      }

      const target =
        document.objects[endpoint.objectId]

      if (!target) {
        fail(
          `Connector "${object.id}" refers to missing object "${endpoint.objectId}".`,
        )
      }

      if (target.pageId !== object.pageId) {
        fail(
          `Connector "${object.id}" cannot connect objects across pages.`,
        )
      }
    }
  }
}
