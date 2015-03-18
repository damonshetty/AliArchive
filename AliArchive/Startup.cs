using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(AliArchive.Startup))]
namespace AliArchive
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
