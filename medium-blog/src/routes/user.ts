import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import z from "zod";
import { signupInput, signinInput } from "@maddy007/medium-common";


export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
    
}>();


userRouter.post('/signup', async(c) => {
    const body = await c.req.json();
    const { success } =signupInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message : "Inputs not correct"
        })
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
      try {
          const user = await prisma.user.create({
              data: {
                  username: body.username,
                  password: body.password,
                  name: body.name
              }
          });
          const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
          return c.json({ jwt });
  } catch(e) {
    return c.status(403);
  }
  })
  
  userRouter.post('/signin', async (c) => {
    // const authorId = c.get("userId");
    const body = await c.req.json();
    const { success } =signinInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message : "Inputs not correct"
        })
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
      try {
          const user = await prisma.user.findFirst({
              where: {
                  username: body.username,
                  password: body.password,
                  name: body.name
              }
          });
  
      if (!user) {
        c.status(403);
        return c.json({ error: "user not found" });
      }
    
          const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
          return c.json({ jwt });
  } catch(e) {
    return c.status(411);
  }
  })
  