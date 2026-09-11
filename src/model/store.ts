import type {
  BioPlotDocument,
  BioPlotLocale,
  ObjectId,
  SceneObject,
} from './document'

import {
  assertBioPlotDocumentIntegrity,
} from './integrity'

export type DocumentChangeReason =
  | 'replace'
  | 'title'
  | 'locale'
  | 'metadata'
  | 'object:add'
  | 'object:update'
  | 'object:remove'
  | 'page:update'
  | 'transaction'

export interface DocumentChange {
  revision: number

  reason: DocumentChangeReason

  document: BioPlotDocument
}

export type DocumentListener = (
  change: DocumentChange,
) => void

export type DocumentMutator = (
  draft: BioPlotDocument,
) => void

function cloneDocument(
  document: BioPlotDocument,
): BioPlotDocument {
  return structuredClone(document)
}

function nowIso() {
  return new Date().toISOString()
}

export class BioPlotDocumentStore {
  private document: BioPlotDocument

  private revision = 0

  private readonly listeners =
    new Set<DocumentListener>()

  constructor(initialDocument: BioPlotDocument) {
    assertBioPlotDocumentIntegrity(
      initialDocument,
    )

    this.document =
      cloneDocument(initialDocument)
  }

  /*
   * Returns a safe snapshot.
   *
   * Callers cannot accidentally mutate
   * the internal canonical document.
   */
  getSnapshot(): BioPlotDocument {
    return cloneDocument(this.document)
  }

  getRevision(): number {
    return this.revision
  }

  subscribe(
    listener: DocumentListener,
  ): () => void {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit(
    reason: DocumentChangeReason,
  ) {
    const change: DocumentChange = {
      revision: this.revision,

      reason,

      document: this.getSnapshot(),
    }

    for (const listener of this.listeners) {
      try {
        listener(change)
      } catch (error) {
        console.error(
          'BioPlot document listener failed:',
          error,
        )
      }
    }
  }

  /*
   * All document writes eventually pass
   * through this method.
   *
   * This is the central write gate.
   */
  mutate(
    reason: DocumentChangeReason,
    mutator: DocumentMutator,
  ): BioPlotDocument {
    const draft =
      cloneDocument(this.document)

    mutator(draft)

    draft.updatedAt = nowIso()

    assertBioPlotDocumentIntegrity(draft)

    this.document = draft

    this.revision += 1

    this.emit(reason)

    return this.getSnapshot()
  }

  /*
   * Replace the entire document.
   *
   * Useful for:
   * - project loading
   * - future migrations
   * - history restore
   */
  replace(
    nextDocument: BioPlotDocument,
  ): BioPlotDocument {
    assertBioPlotDocumentIntegrity(
      nextDocument,
    )

    this.document =
      cloneDocument(nextDocument)

    this.revision += 1

    this.emit('replace')

    return this.getSnapshot()
  }

  setTitle(title: string): BioPlotDocument {
    const normalized =
      title.trim() ||
      'Untitled scientific figure'

    if (normalized === this.document.title) {
      return this.getSnapshot()
    }

    return this.mutate(
      'title',
      (draft) => {
        draft.title = normalized
      },
    )
  }

  setLocale(
    locale: BioPlotLocale,
  ): BioPlotDocument {
    if (locale === this.document.locale) {
      return this.getSnapshot()
    }

    return this.mutate(
      'locale',
      (draft) => {
        draft.locale = locale
      },
    )
  }

  setMetadata(params: {
    description?: string
    tags?: string[]
  }): BioPlotDocument {
    return this.mutate(
      'metadata',
      (draft) => {
        if (
          params.description !== undefined
        ) {
          draft.metadata.description =
            params.description
        }

        if (params.tags !== undefined) {
          draft.metadata.tags = [
            ...params.tags,
          ]
        }
      },
    )
  }

  addObject(
    object: SceneObject,
  ): BioPlotDocument {
    if (this.document.objects[object.id]) {
      throw new Error(
        `BioPlot object "${object.id}" already exists.`,
      )
    }

    return this.mutate(
      'object:add',
      (draft) => {
        draft.objects[object.id] =
          structuredClone(object)

        if (object.parentId === null) {
          const page = draft.pages.find(
            (candidate) =>
              candidate.id === object.pageId,
          )

          if (!page) {
            throw new Error(
              `Cannot add object to missing page "${object.pageId}".`,
            )
          }

          page.rootObjectIds.push(
            object.id,
          )

          return
        }

        const parent =
          draft.objects[object.parentId]

        if (
          !parent ||
          parent.type !== 'group'
        ) {
          throw new Error(
            `Cannot add object to invalid group "${object.parentId}".`,
          )
        }

        parent.childIds.push(object.id)
      },
    )
  }

  updateObject(
    objectId: ObjectId,
    updater: (
      object: SceneObject,
    ) => SceneObject,
  ): BioPlotDocument {
    return this.mutate(
      'object:update',
      (draft) => {
        const current =
          draft.objects[objectId]

        if (!current) {
          throw new Error(
            `BioPlot object "${objectId}" does not exist.`,
          )
        }

        const updated =
          updater(
            structuredClone(current),
          )

        if (updated.id !== objectId) {
          throw new Error(
            'Object id cannot be changed during update.',
          )
        }

        if (
          updated.parentId !==
            current.parentId ||
          updated.pageId !== current.pageId
        ) {
          throw new Error(
            'Use dedicated hierarchy operations to move objects between groups or pages.',
          )
        }

        draft.objects[objectId] =
          structuredClone(updated)
      },
    )
  }

  removeObject(
    objectId: ObjectId,
  ): BioPlotDocument {
    if (!this.document.objects[objectId]) {
      return this.getSnapshot()
    }

    return this.mutate(
      'object:remove',
      (draft) => {
        const removalIds =
          new Set<ObjectId>()

        const collect = (
          id: ObjectId,
        ) => {
          if (removalIds.has(id)) {
            return
          }

          const object =
            draft.objects[id]

          if (!object) return

          removalIds.add(id)

          if (object.type === 'group') {
            for (
              const childId of
              object.childIds
            ) {
              collect(childId)
            }
          }
        }

        collect(objectId)

        /*
         * Connectors attached to removed
         * objects must also be removed.
         */
        for (const object of Object.values(
          draft.objects,
        )) {
          if (
            object.type !== 'connector'
          ) {
            continue
          }

          const startRemoved =
            object.start.kind ===
              'object' &&
            removalIds.has(
              object.start.objectId,
            )

          const endRemoved =
            object.end.kind ===
              'object' &&
            removalIds.has(
              object.end.objectId,
            )

          if (
            startRemoved ||
            endRemoved
          ) {
            removalIds.add(object.id)
          }
        }

        /*
         * Remove references from pages.
         */
        for (const page of draft.pages) {
          page.rootObjectIds =
            page.rootObjectIds.filter(
              (id) =>
                !removalIds.has(id),
            )
        }

        /*
         * Remove references from groups.
         */
        for (const object of Object.values(
          draft.objects,
        )) {
          if (object.type !== 'group') {
            continue
          }

          object.childIds =
            object.childIds.filter(
              (id) =>
                !removalIds.has(id),
            )
        }

        /*
         * Finally remove actual objects.
         */
        for (const id of removalIds) {
          delete draft.objects[id]
        }
      },
    )
  }
}
