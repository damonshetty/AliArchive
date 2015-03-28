using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;

namespace AliArchive.Repository.EntityFramework
{
    public interface IRepository : IDisposable
    {
        IQueryable<T> All<T>() where T : class;
        IQueryable<T> AllIncludingFights<T>(params Expression<Func<T,object>>[] include) where T : class;

        IQueryable<T> AllFights<T>(params Expression<Func<T, object>>[] include) where T : class;
    }
}
