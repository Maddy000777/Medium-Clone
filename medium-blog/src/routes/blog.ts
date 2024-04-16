import { createBlogInput, updateBlogInput } from "@maddy007/medium-common";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    },
    Variables: {
        userId: string;
    }
}>();

blogRouter.use("/*", async (c, next) => {
    const authHeader = c.req.header('authorization') || " ";
    const user = await verify(authHeader, c.env.JWT_SECRET);
    if (user) {
        c.set("userId", user.id);
        await next();
    } else {
        c.status(403);
        return c.json({ message: "You are not logged in" });
    }
});

blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    const { success } =createBlogInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message : "Inputs not correct"
        })
    }
    const authorId = c.get("userId");
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const blog = await prisma.blog.create({
            data: {
                title: body.title,
                content: body.content,
                // Associate the blog with the author by connecting to the authorId
                author: { connect: { id: authorId } }
            }
        });

        return c.json({
            id: blog.id
        });
    } catch (error) {
        console.error("Error creating blog:", error);
        c.status(500);
        return c.json({ message: "Error creating blog" });
    }
});

blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const { success } =updateBlogInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message : "Inputs not correct"
        })
    }
    const authorId = c.get("userId");
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const blog = await prisma.blog.update({
            where: { id: body.id },
            data: {
                title: body.title,
                content: body.content,
                author: { connect: { id: authorId } }
            }
        });

        return c.json({
            id: blog.id
        });
    } catch (error) {
        console.error("Error updating blog:", error);
        c.status(500);
        return c.json({ message: "Error updating blog" });
    }
});

blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const blogs = await prisma.blog.findMany({
            select: {
                content: true,
                title: true,
                id: true,
                author: {
                    select : {
                        name: true
                    }
                }
            }
        });
        return c.json({ blogs });
    } catch (error) {
        console.error("Error fetching blogs:", error);
        c.status(500);
        return c.json({ message: "Error fetching blogs" });
    }
});

blogRouter.get('/:id', async (c) => {
    const id = c.req.param("id");
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const blog = await prisma.blog.findFirst({
            where: { id: id },
            select: {
                content: true,
                title: true,
                id: true,
                author: {
                    select : {
                        name: true
                    }
                }
            }
        });

        return c.json({ blog });
    } catch (error) {
        console.error("Error fetching blog:", error);
        c.status(500);
        return c.json({ message: "Error fetching blog" });
    }
});


