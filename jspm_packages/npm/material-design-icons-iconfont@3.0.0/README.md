# Material design icons

This repository is some kind of a *fork* of the [original repository](https://github.com/google/material-design-icons) Google published.

It created to **make it easy to add dependency to Google's iconfont in bower / npm** and improve the usability

### Why?, What's the need?

In the source repository when you checkout / using npm install / bower install / ... 

There are many (many) source svg files that you receive as well. These file are irrelevant and cause congestion (especially when using in CI solutions - it jams them.)

Using only the final, compiled font will improve Usage Experience, **Developers Experience** and will make the world a better place.


### What's the difference?

Kept only the `iconfont` directory (the compiled font) while everything else **has been ommited** 

### Using the iconfont

using bower 
```
bower install material-design-icons-iconfont --save
```

using npm
```
npm install material-design-icons-iconfont --save
```


![image](https://cloud.githubusercontent.com/assets/1287098/14408314/09487f1e-fef8-11e5-83e3-d54438a633b8.png)


### Dear Google,

First, thanks for the iconfont. 

Second, you've published the awesome Material Design specs which is mainly about UX, right? What about **DX - Developer Experience?** Please kindly rethink about the usability
