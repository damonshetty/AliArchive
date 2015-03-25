using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(AliArchive.UI.Web.MVC.Startup))]
namespace AliArchive.UI.Web.MVC
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
