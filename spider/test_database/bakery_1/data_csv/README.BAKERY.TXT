*****************************************************
CPE 365                                 Alex Dekhtyar
Cal Poly		  Computer Science Department
San Luis Obispo                College of Engineering 
California                   dekhtyar@csc.calpoly.edu   
*****************************************************
		  BAKERY DATASET
                   Version 1.0
                October 1, 2007
*****************************************************
Sources:  this is a synthesized dataset. 

******************************************************

This file describes the contents of the BAKERY dataset
developed for the CPE 365, Introduction to Databases,
course at Cal Poly.

The dataset contains information about one month worth
of sales information for a small bakery shop. The sales
are made to known customers. The dataset contains
information about the customers, the assortments of
baked goods offered for sale and the purchases made.


General Conventions.

 1. All files in the dataset are CSV (comma-separated values) files.
 2. First line of each file provides the names of
    columns. Second line may be empty, or may contain
    the first row of the data.
 3. All string values are enclosed in single quotes (')


  The dataset consists of the following files:

   - customers.csv : information about the bakery's customers
   - goods.csv     : information about the baked goods offered
                     for sale by the bakery
   - items.csv     : itemized reciept infromation for purchases
   - reciepts.csv  : general reciept information for purchases


 reciepts.csv stores information about individual reciepts
(purchases by customers). Each purchase may contain from
one two five items, regardless of whether any items
purchased are of the same kind (e.g., two "chocolate cakes"
will be billed as two separate items on the reciept).
items.csv contains itemized reciept information.


 Individual files have the following formats.

**************************************************************************

 customers.csv

        Id: unique identifier of the customer
  LastName: last name of the customer
 FirstName: first name of the customer



**************************************************************************


 goods.csv

     Id : unique identifier of the baked good
  Flavor: flavor/type of the good (e.g., "chocolate", "lemon")
    Food: category of the good (e.g., "cake", "tart")
   Price: price (in dollars) 



**************************************************************************

items.csv

    Reciept : reciept number (see reciepts.RecieptNumber)
    Ordinal : position of the purchased item on the
              reciepts. (i.e., first purchased item,
              second purchased item, etc...)
    Item    : identifier of the item purchased (see goods.Id)
    


**************************************************************************

reciepts.csv

RecieptNumber : unique identifier of the reciept
         Date : date of the purchase. The date is
                in  DD-Mon-YYY format, which is the
                default Oracle's format for DATE data type.
   CustomerId : id of the customer (see customers.Id)


**************************************************************************
**************************************************************************

Permission granted to use and distribute this dataset in its current form, 
provided this file  is kept unchanged and is distributed together with the 
data.

Permission granted to modify and expand this dataset, provided this
file is updated accordingly with new information.

**************************************************************************
**************************************************************************
