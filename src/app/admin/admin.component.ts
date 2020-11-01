import { Component, OnInit } from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, Validators} from '@angular/forms';
import {Author, Book} from '../books/model/book';
import {BooksService} from '../books/service/books.service';

function categoryValidator(control: FormControl): { [s: string]: boolean } | null {
  const validCategories = ['Kids', 'Tech', 'Cook'];
  if (!validCategories.includes(control.value)) {
    return {invalidCategory: true};
  }
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  message: string;
  hideMsg = true;
  msgStyle = {
    color: null,
    'background-color': 'white',
    'font-size': '150%',
  };
  bookForm = this.builder.group({
    category: ['', [Validators.required, categoryValidator]],
    title: ['', Validators.required],
    cost: ['', [Validators.required, Validators.pattern('\\d+(\\.\\d{1,2})?')] ],
    authors: this.builder.array([]),
    year: [''],
    description: ['']
  });

  get category(): AbstractControl {return this.bookForm.get('category'); }
  get title(): AbstractControl {return this.bookForm.get('title'); }
  get cost(): AbstractControl {return this.bookForm.get('cost'); }
  get authors(): FormArray {
    return this.bookForm.get('authors') as FormArray;
  }

  constructor(private builder: FormBuilder,
              private booksService: BooksService) { }

  ngOnInit(): void {
  }

  showMessage(type: string, msg: string): void {
    this.msgStyle.color = type === 'error' ? 'red' : 'blue';
    this.message = msg;
    this.hideMsg = false;
    setTimeout(
      () => {
        this.hideMsg = true;
      }, 3000
    );
  }

  onSubmit(): void {
    const book =  new Book(0,
      this.bookForm.value.category,
      this.bookForm.value.title,
      Number(this.bookForm.value.cost),
      [],
      Number(this.bookForm.value.year),
      this.bookForm.value.description);
    const authors = this.bookForm.value.authors;
    this.booksService.addBook(book).subscribe(
      (response) => {
        authors.forEach(
          (author) => {
            this.booksService.getAuthorsNamed(author.firstName, author.lastName).subscribe(
              (authorList: Author[]) => {
                if (authorList === undefined || authorList.length === 0) {
                  this.booksService.addBookAuthor(response.id, author).subscribe();
                } else {
                  // *** Assumes unique firstName/LastName for Authors
                  this.booksService.updateBookAuthors(response.id, authorList[0].id).subscribe();
                }
              }
            );
          }
        );
        this.showMessage('info', `The was successfully added with id ${response.id}`);
      },
    (_: any) => {
      this.showMessage('error', 'Unable to add the book');
    }
    );
    this.bookForm.reset();
    this.authors.clear();
  }

  addAuthor(): void {
    this.authors.push(
      this.builder.group({
        firstName: [''],
        lastName: ['']
      })
    );
  }

  removeAuthor(i: number): void {
    this.authors.removeAt(i);
  }
}

