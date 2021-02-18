import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { Component, OnDestroy } from '@angular/core';
import { Task } from './task/task';
import { TaskDialogComponent, TaskDialogResult } from './task-dialog/task-dialog.component';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy{

  title = 'kanban-fire';
  todo: any[] = [];
  inProgress: any[] = [];
  done: any[] = [];

  todo$ : Subscription
  inProgress$ : Subscription
  done$ : Subscription

  constructor(
    private dialog: MatDialog,
    private store: AngularFirestore
  ) {
    this.todo$ = this.store.collection('todo').valueChanges({ idField: 'id' }).subscribe(
      x => this.todo = x
    );
    this.inProgress$ = this.store.collection('inProgress').valueChanges({ idField: 'id' }).subscribe(
      x => this.inProgress = x
    );
    this.done$ = this.store.collection('done').valueChanges({ idField: 'id' }).subscribe(
      x => this.done = x
    );

  }

  ngOnDestroy(): void {
    this.todo$.unsubscribe();
    this.inProgress$.unsubscribe();
    this.done$.unsubscribe();
  }

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult) => {
      if (result.delete) {
        this.store.collection(list).doc(task.id).delete();
      } else {
        this.store.collection(list).doc(task.id).update(task);
      }
    });
  }

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult) => this.store.collection('todo').add(result.task));
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    this.store.firestore.runTransaction(() => {
      const promise = Promise.all([
        this.store.collection(event.previousContainer.id).doc(item.id).delete(),
        this.store.collection(event.container.id).add(item),
      ]);
      return promise;
    });
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }

}
