import { ApolloLink, Observable } from '@apollo/client'

type QueueEntry = {
  run: () => void
}

export class QueueLink extends ApolloLink {
  private opQueue: QueueEntry[] = []
  private isOpen = true

  open() {
    this.isOpen = true
    for (const entry of this.opQueue) {
      entry.run()
    }
    this.opQueue = []
  }

  close() {
    this.isOpen = false
  }

  request(
    operation: ApolloLink.Operation,
    forward: ApolloLink.ForwardFunction
  ): Observable<ApolloLink.Result> {
    if (this.isOpen || operation.getContext().skipQueue) {
      return forward(operation)
    }

    return new Observable<ApolloLink.Result>((observer) => {
      let activeSubscription: { unsubscribe: () => void } | null = null
      const entry: QueueEntry = {
        run: () => {
          activeSubscription = forward(operation).subscribe(observer)
        }
      }

      this.opQueue.push(entry)

      return () => {
        this.opQueue = this.opQueue.filter((queued) => queued !== entry)
        activeSubscription?.unsubscribe()
      }
    })
  }
}
