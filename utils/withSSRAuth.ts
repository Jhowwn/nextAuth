import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { parseCookies } from "nookies";

export function withSSRAuth<p>(fn: GetServerSideProps<p>): GetServerSideProps {
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<p>> => {
        const cookies = parseCookies(ctx);

        if (!cookies['nextauth.token']) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false
                }
            }
        }

        return await fn(ctx)
    }
}