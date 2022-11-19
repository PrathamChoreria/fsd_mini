const express=require("express");
const app=express();
const ejs=require("ejs");
const bodyParser = require("body-parser");
var mysql=require("mysql");
var session=require("express-session");


//connection


app.use(express.static("public"));
app.set("view engine","ejs");
app.listen(3000);
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({secret:"secret",resave: true,
saveUninitialized: true}))


function isProductInCart(cart,id){
   for(let i=0;i<cart.length;i++){
    if(cart[i].id==id){
        return true;
    }
   }

   return false;
}


function calculateTotal(cart,req){
    total=0;
    for(let i=0;i<cart.length;i++){
        if(cart[i].sale_price){
            total=total+(cart[i].sale_price*cart[i].quantity)
        }else{
            total=total+(cart[i].price*cart[i].quantity)
        }
    }

    req.session.total=total;
    return total;
}


app.get("/",(req,res)=>{
    var con =mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        port:3307,
        database:"node_project"
      })
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
      });
    con.query("SELECT * FROM products",(err,result)=>{
        res.render("pages/index",{result:result});
    })
    
})


app.post("/add_to_cart",(req,res)=>{


     var id=req.body.id;
     var name=req.body.name;
     var price=req.body.price;
     var sale_price=req.body.sale_price;
     var description=req.body.description;
     var quantity=req.body.quantity;
     var image=req.body.image;
     var product={id:id,name:name,price :price,sale_price:sale_price,description:description,quantity:quantity,image:image};
     var products=[];

     
    if(req.session.cart){
        var cart=req.session.cart;

        if(!isProductInCart(cart,id)){
            cart.push(product);
        }
    }
        else{
            products=products+product;
            req.session.cart=[product];
            var cart=req.session.cart;

        }
        
    
    

    calculateTotal(cart,req);
    console.log(cart);

    res.redirect("/");
    app.get("/go_cart",(req,res)=>{
        
        res.redirect('/cart');
        products=[];
    })
    


})

app.get("/cart",(req,res)=>{
    var cart=req.session.cart;
    var total=req.session.total;
    console.log(cart);
    res.render("pages/cart",{cart:cart,total:total});
})

app.post("/remove_product",(req,res)=>{
      var id=req.body.id;
      var cart=req.session.cart;
      

      for (let i=0;i<cart.length;i++){
        if(cart[i].id==id){
            cart.splice(cart.indexOf(i),1);
        }
      }

      calculateTotal(cart,req);
      
      res.redirect("/cart");
      console.log(id);
      console.log(cart);
      console.log(calculateTotal(cart,req));
})


app.post("/edit_product_quantity",(req,res)=>{
   var quantity=req.body.quantity; 
   var id=req.body.id;
   var increase_btn=req.body.increase_product_quantity;
   var decrease_btn=req.body.decrease_product_quantity;
   
   var cart=req.session.cart;

   if(increase_btn){
    for (let i=0;i<cart.length;i++){
        if(cart[i].id==id){
            if(cart[i].quantity>0){
                cart[i].quantity=parseInt(cart[i].quantity)+1;
                
            }
        }
    }
   }
   
   if(decrease_btn){
    for (let i=0;i<cart.length;i++){
        if(cart[i].id==id){
            if(cart[i].quantity>1){
                cart[i].quantity=parseInt(cart[i].quantity)-1;

            }
        }
    }
   }

   calculateTotal(cart,req);
   res.redirect("/cart");


});

app.get("/checkout",(req,res)=>{
    var total=req.session.total;

    res.render("pages/checkout",{total:total});

})

app.post("/place_order",(req,res)=>{
    var name=req.body.name;
    var email=req.body.email;
    var phone=req.body.phone;
    var city=req.body.city;
    var address=req.body.address;
    var cost=req.session.total;
    var status="not paid";
    var date=new Date();
    var products_ids=[];
    
    

    var con =mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        port:3307,
        database:"node_project"
      })

      var cart=req.session.cart;
      for(let i=0;i<cart.length;i++){
        products_ids=products_ids+cart[i].id+",";
      }

    con.connect((err)=>{
        if(err){
            res.send("Error please enter different name or emailid");
            console.log({err:err});
        }
        else{
            var query="INSERT INTO orders(cost,name,email,status,city,address,phone,date,products_ids) VALUES ?";
            var values=[
                [cost,name,email,status,city,address,phone,date,products_ids]
            ];
            con.query(query,[values],(err,result)=>{
                if(!err){
                    console.log(values);
                    res.render("pages/billing_info",{info:values})
                    console.log('inserted')
                }
                else{
                    console.log(err);
                }
            })

        }
       
    })  
    
})


app.get("/clear",(req,res)=>{
    req.session.cart=null;
    req.session.total=null;
    req.session.info=null;
    res.redirect("/");
})

app.get("/go_to_feedback",(req,res)=>{
    res.render("pages/shop.ejs");
})

app.post("/store_feedback",(req,res)=>{
    var name=req.body.name;
    var email=req.body.email;
    var description=req.body.description;

    var con =mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        port:3307,
        database:"node_project"
      })
      con.connect(function(err) {
        if (err) {throw err;}
        else{
        console.log("Connected!");
        var query="INSERT INTO feedback(name,email,description) VALUES ?";
        var values=[[name,email,description]];
        con.query(query,[values],(err,result)=>{
            if(!err){
                console.log("feedback sent");
            }
            else{
                console.log(err);
            }
        })
      }
    })


})

app.get("/sweat_info",(req,res)=>{
    var cat_id=1;
    var con =mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        port:3307,
        database:"node_project"
      })

  
    con.connect((err)=>{
        if(!err){
            var query="Select * from products where category_id=?";
            var values=cat_id;
            con.query(query,[values],(err,result)=>{
                res.render("pages/index",{result:result});
        })
    }
})  
});
app.get("/jeans_info",(req,res)=>{
    var cat_id=2;
    var con =mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        port:3307,
        database:"node_project"
      })

  
    con.connect((err)=>{
        if(!err){
            var query="Select * from products where category_id=?";
            var values=cat_id;
            con.query(query,[values],(err,result)=>{
                res.render("pages/index",{result:result});
        })
    }
})  
});